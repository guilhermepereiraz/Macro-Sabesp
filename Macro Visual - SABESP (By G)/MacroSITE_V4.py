from selenium.webdriver.edge.options import Options
from time import sleep
import time
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, ElementClickInterceptedException
import pandas as pd
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import os
from selenium.webdriver.support.ui import Select
from dateutil.relativedelta import relativedelta
import io
import eel
import threading
import sys
import pymysql
import base64
import pymysql.cursors
import logging # Para o logging
from datetime import datetime

eel.init('web')

macro_pausada = False
pausa_event = threading.Event()
parar_macro_event = threading.Event()
total_os_processadas = 0
total_os_a_processar = 0
lock_processadas = threading.Lock()
tempos_processamento = []
lock_tempos = threading.Lock()

@eel.expose
def pausar_macro_backend():
    global macro_pausada
    macro_pausada = True
    print("Macro solicitada para pausar.")

@eel.expose
def continuar_macro_backend():
    global macro_pausada
    print("continuar_macro_backend() foi chamada.")
    macro_pausada = False
    print(f"macro_pausada agora é: {macro_pausada}")
    pausa_event.set()
    print("pausa_event.set() foi chamado.")
    print("Macro solicitada para continuar.")

macro_rodando = False


@eel.expose
def parar_macro_backend():
    global macro_rodando, parar_macro_event
    print("Solicitação para parar a macro e encerrar a aplicação.")
    macro_rodando = False
    parar_macro_event.set()
    eel.close_window()
    sys.exit()

def formatar_tempo(segundos):
    horas = int(segundos // 3600)
    minutos = int((segundos % 3600) // 60)
    seg = int(segundos % 60)
    return f"{horas:02d}:{minutos:02d}:{seg:02d}"

def calcular_tempo_restante(total_processadas, total_a_processar, lista_tempos):
    if total_processadas > 0 and total_a_processar > total_processadas:
        with lock_tempos:
            if lista_tempos:
                media_tempo = sum(lista_tempos) / len(lista_tempos)
                restantes = total_a_processar - total_processadas
                tempo_restante_segundos = restantes * media_tempo
                return formatar_tempo(tempo_restante_segundos)
    return "Calculando..."



def inserir_dados_banco(valor, fornecimento_wfm, str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario):
    """
    Insere dados de processamento no banco de dados usando PyMySQL.
    Inclui logging detalhado e tratamento de erros.
    """
    db_user = 'root'
    db_password = 'SB28@sabesp'
    db_host = '10.51.109.123'  # Verifique se o IP está correto
    db_name = 'pendlist'
    connection = None
    cursor = None # Inicializa cursor como None

    try:
        # --- CORREÇÃO: APENAS pymysql.connect ---
        # Use a configuração do banco para conectar com PyMySQL
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )

        # --- CORREÇÃO: REMOVIDO .is_connected() ---
        # Verifica se a conexão foi criada sem levantar exceção (PyMySQL levanta exceção em caso de falha)
        if connection: # <-- Verifica se connection não é None
            logging.info(f"Thread {threading.current_thread().name}: Conexão com o banco de dados bem-sucedida para inserção!")

        # --- CORREÇÃO: Use pymysql.cursors.DictCursor se precisar ---
        # Cursor padrão (acesso por índice)
        # cursor = connection.cursor()
        # Cursor de Dicionário (acesso por nome de coluna)
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        sql = """
        INSERT INTO tb_consulta_site(Os, fornecimento, resultado_site, tipo_arquivo, nome_arquivo, autor)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (valor, fornecimento_wfm, str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario)
        cursor.execute(sql, values)
        connection.commit()
        logging.info(f"Thread {threading.current_thread().name}: Dados inseridos com sucesso! OS: {valor}, Fornecimento: {fornecimento_wfm}, Resultado Site: {str_status_site}, Tipo do arquivo: {tipo_arquivo}, nome do arquivo {nome_arquivo}, Autor: {identificador_usuario}")

    # --- CORREÇÃO: except pymysql.Error ---
    except pymysql.Error as e:
        logging.error(f"Thread {threading.current_thread().name}: Erro do banco de dados (PyMySQL) ao inserir os dados: {e}")
        # Use logging.exception para obter o traceback completo do erro do DB
        logging.exception(f"Thread {threading.current_thread().name}: Detalhes do erro do banco de dados (PyMySQL) ao inserir dados:")
        if connection: # Verifica se connection existe antes de tentar rollback
            connection.rollback()
    # --- ADICIONADO: except Exception para capturar outros erros inesperados ---
    except Exception as e:
         logging.error(f"Thread {threading.current_thread().name}: Ocorreu um erro inesperado na função inserir_dados_banco: {e}")
         logging.exception(f"Thread {threading.current_thread().name}: Detalhes do erro inesperado na função inserir_dados_banco:")

    finally:
        # --- CORREÇÃO: REMOVIDO .is_connected() ---
        # Verifica se connection existe antes de tentar fechar
        if connection:
            if cursor: # Verifica se o cursor foi criado antes de fechar
                cursor.close()
            connection.close()
            logging.info(f"Thread {threading.current_thread().name}: Conexão com o banco de dados fechada após inserção.")


def reiniciar_macro_thread(driver_thread, wait_thread, valor):
    xpath_principal = '//*[@id="box"]/div[3]/div/div/div/div/div[3]'
    xpath_alternativo = '//*[@id="box"]/div[3]/div/div/div/div/div[2]'

    print(f"Thread {threading.current_thread().name}: Pressionando F5 para reiniciar o navegador...")
    driver_thread.refresh()
    WebDriverWait(driver_thread, 30).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    print(f"Thread {threading.current_thread().name}: Página recarregada com sucesso.")

    driver_thread.switch_to.default_content()
    print(f"Thread {threading.current_thread().name}: Alterando para o iframe principal...")
    wait_thread.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))
    print(f"Thread {threading.current_thread().name}: Iframe carregado com sucesso!")

    print(f"Thread {threading.current_thread().name}: Tentando localizar 'nova instância'...")
    try:
        novainstanciaprincipal = WebDriverWait(driver_thread, 10).until(
            EC.visibility_of_element_located((By.XPATH, xpath_principal))
        )
        novainstanciaprincipal.click()
        print(f"Thread {threading.current_thread().name}: Clicando em nova instância verde (principal).")
    except TimeoutException:
        print(f"Thread {threading.current_thread().name}: Elemento principal não encontrado, tentando o alternativo...")
        try:
            novainstancia = WebDriverWait(driver_thread, 10).until(
                EC.visibility_of_element_located((By.XPATH, xpath_alternativo))
            )
            novainstancia.click()
            print(f"Thread {threading.current_thread().name}: Clicando em nova instância vermelha (alternativa).")
        except TimeoutException:
            print(f"Thread {threading.current_thread().name}: Nenhuma das opções foi encontrada.")
            if driver_thread:
                driver_thread.quit()
            return login_thread(driver_thread, wait_thread)

    try:
        print(f"Thread {threading.current_thread().name}: Tentando clicar em 'planejamento'...")
        planejamento = WebDriverWait(driver_thread, 60).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
        )
        planejamento.click()
        print(f"Thread {threading.current_thread().name}: Clique em 'planejamento' bem-sucedido.")

    except (StaleElementReferenceException, TimeoutException):
        print(f"Thread {threading.current_thread().name}: Erro ao clicar em 'planejamento'.")

    try:
        print(f"Thread {threading.current_thread().name}: Tentando clicar em 'busca execução'...")
        busca_execucao = WebDriverWait(driver_thread, 60).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        busca_execucao.click()
        print(f"Thread {threading.current_thread().name}: Clique em 'busca execução' bem-sucedido.")

    except (StaleElementReferenceException, TimeoutException):
        print(f"Thread {threading.current_thread().name}: Erro ao clicar em 'busca execução'.")

def armazenar_dados_proc_final_thread(fornecimento, os_numero, status):
    pde_lista = [{"FORNECIMENTO": fornecimento, "OS": os_numero, "RESULTADO": status}]
    df = pd.DataFrame(pde_lista)

    home_dir = os.path.expanduser('~')

    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Macro SITE')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")


    try:
        os.makedirs(output_dir, exist_ok=True)
        print(f"Estrutura de pastas criada ou já existente: {output_dir}")
    except Exception as e:
        print(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")

    output_file_path = os.path.join(output_dir, f'ResultadoSITE.csv{data_formatada}')

    file_exists = os.path.exists(output_file_path)

    try:
        if file_exists:
            # Se o arquivo já existe, anexa os dados sem cabeçalho
            df.to_csv(output_file_path, mode='a', header=False, index=False, encoding='UTF-8-SIG', sep=';')
            print(f"Dados anexados ao arquivo: {output_file_path}")
        else:
            # Se o arquivo não existe, cria um novo com cabeçalho
            df.to_csv(output_file_path, index=False, encoding='UTF-8-SIG', sep=';')
            print(f"Novo arquivo criado: {output_file_path}")


    except Exception as e:
         print(f"Erro ao salvar os dados no arquivo CSV {output_file_path}: {e}")

# def apagar_processada_thread():
#     arquivo = 'template.csv'
#     if os.path.exists(arquivo):
#         try:
#             df = pd.read_csv(arquivo)
#             if not df.empty:
#                 df = df.iloc[1:]
#                 df.to_csv(arquivo, index=False)
#             else:
#                 print(f"Thread {threading.current_thread().name}: O arquivo {arquivo} está vazio.")
#         except FileNotFoundError:
#             print(f"Thread {threading.current_thread().name}: Arquivo {arquivo} não encontrado.")
#         except Exception as e:
#             print(f"Thread {threading.current_thread().name}: Ocorreu um erro ao remover o primeiro PDE: {e}")
#     else:
#         print(f"Thread {threading.current_thread().name}: Arquivo {arquivo} não encontrado.")

def login_thread(driver_thread, wait_thread, login_digitado, senha_digitada):
    prefs = {"profile.default_content_setting_values.notifications": 2}
    options = Options()
    options.add_argument("--headless") # Deixa o navegador invisivel
    options.add_argument("--disable-gpu") # Deixa o navegador invisivel
    # options.add_argument("--start-fullscreen")  # Removi daqui, pode causar problemas com headless


    try:
        driver_thread.get('https://geoprd.sabesp.com.br/sabespwfm/')
        driver_thread.maximize_window()
        driver_thread.switch_to.frame(driver_thread.find_element(By.NAME, "mainFrame"))
        time.sleep(2)
        username_field = driver_thread.find_element(By.CSS_SELECTOR, "input[id='USER']")
        password_field = driver_thread.find_element(By.CSS_SELECTOR, 'input[id="INPUTPASS"]')
        login_button = driver_thread.find_element("id", "submbtn")

        username_field.send_keys(login_digitado)
        password_field.send_keys(senha_digitada)
        login_button.click()

        time.sleep(2)

        WebDriverWait(driver_thread, 120).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))).click()
        WebDriverWait(driver_thread, 120).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))).click()
        return True

    except Exception as e:
        print(f"Thread {threading.current_thread().name}: Erro durante o login: {str(e)}")
        if driver_thread:
            driver_thread.quit()
        return False

def macro_thread(driver_thread, wait_thread, valor):
    time.sleep(0.5)
    try:
        busca_execucao = WebDriverWait(driver_thread, 10).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        driver_thread.execute_script("arguments[0].click();", busca_execucao)

    except TimeoutException:
        try:
            planejamento = WebDriverWait(driver_thread, 5).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
            )
            planejamento.click()
            time.sleep(5)
            busca_execucao = WebDriverWait(driver_thread, 30).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
            driver_thread.execute_script("arguments[0].click();", busca_execucao)
            time.sleep(5)
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            status_avaliacao = WebDriverWait(driver_thread, 20).until(EC.presence_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[9]/tr[1]/td/span/img')))
            driver_thread.execute_script("arguments[0].click();", status_avaliacao)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            com_resultado = WebDriverWait(driver_thread, 20).until(EC.presence_of_element_located(
                (By.XPATH, '//select[@name="_lyXWFMRAGMSTATOINIVIO"]')))
            select_neta = Select(com_resultado)
            select_neta.select_by_index(2)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            dados_os = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[13]/tr[1]/td/span/img')))
            dados_os.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            numero_os = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[13]/tr[3]/td[2]/table/tbody/tr/td/input')))
            numero_os.click()
            numero_os.clear()
            numero_os.send_keys(str(valor))
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            contrato_x = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[3]/tr[11]/td[2]/table/tbody/tr/td[3]/img[2]')))
            driver_thread.execute_script("arguments[0].click();", contrato_x)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)
        
    time.sleep(0.5)
    while True:
        try:
            WebDriverWait(driver_thread, 20).until(EC.invisibility_of_element_located((By.ID, "transpdiv-2")))
            botao_buscar = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[3]/tbody/tr/td/table/tbody/tr/td[3]/button')))
            botao_buscar.click()
            break
        except (TimeoutException, StaleElementReferenceException, ElementClickInterceptedException):
            pass
        
    time.sleep(0.5)
    while True:
        try:
            linhas_laranja = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[3]/div[2]/div/div/div/table/tbody/tr[2]/td[1]/div[1]/div/div/img')))
            linhas_laranja.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            WebDriverWait(driver_thread, 20).until(EC.invisibility_of_element_located((By.ID, "transpdiv-2")))
            resultado_intervencao = WebDriverWait(driver_thread, 20).until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Resultado Intervenção')]"))
            )
            resultado_intervencao.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            select_element = WebDriverWait(driver_thread, 20).until(
                EC.presence_of_element_located((By.XPATH, "//select[@name='_lyXSABARODID_XDABLPDE']"))
            )
            if select_element.is_displayed():
                str_status_site = select_element.text
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            dtclientes = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located((By.XPATH, '//*[@id="MTT-mfDettagliUtenza-outpututenza"]')))
            dtclientes.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            forn_usuario = WebDriverWait(driver_thread, 20).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[1]/td/div/div[2]/div[2]/div/div[1]/table/tbody/tr/td[1]/table/tbody/tr/td')))

            if forn_usuario.is_displayed():
                fornecimento_wfm = forn_usuario.text
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            botao_fecha = WebDriverWait(driver_thread, 20).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[3]/div[2]/div[6]')))
            driver_thread.execute_script("arguments[0].click();", botao_fecha)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro_thread(driver_thread, wait_thread, valor)
            return macro_thread(driver_thread, wait_thread, valor)

    time.sleep(0.5)
    while True:
        try:
            WebDriverWait(driver_thread, 120).until(EC.invisibility_of_element_located((By.ID, "transpdiv-0")))
            busca_execucao = WebDriverWait(driver_thread, 20).until(
                EC.element_to_be_clickable((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
            time.sleep(2)
            busca_execucao.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            pass
        except Exception:
            i=0
         
    armazenar_dados_proc_final_thread(fornecimento_wfm, valor, str_status_site)
    # apagar_processada_thread()

    return fornecimento_wfm, valor, str_status_site

def processar_lote_thread(lote_df, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario, num_total_os, coluna_os_nome):
    """
    Função a ser executada por cada thread para processar um lote de dados (DataFrame).
    Acessa o ID da OS usando o nome da coluna fornecido, mantendo a lógica existente.
    """
    driver_thread = None
    wait_thread = None
    global lock_processadas
    global total_os_processadas
    global total_os_a_processar
    global tempos_processamento # Garante que estamos usando a lista global

    # Esta linha já recebe o total da função chamadora, pode manter para clareza
    total_os_a_processar = num_total_os

    try:
        # As importações de selenium podem ser movidas para o topo do arquivo se quiser
        from selenium.webdriver.edge.options import Options
        from selenium import webdriver
        from selenium.webdriver.support.ui import WebDriverWait

        prefs = {"profile.default_content_setting_values.notifications": 2}
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        # Certifique-se de que o driver_thread está sendo inicializado corretamente AQUI
        driver_thread = webdriver.ChromiumEdge(options=options)
        wait_thread = WebDriverWait(driver_thread, 10)
        # Fim da inicialização do driver/wait

        # Lógica de Login - Mantida
        if not login_thread(driver_thread, wait_thread, login_usuario, senha_usuario):
            print(f"Thread {threading.current_thread().name}: Falha no login.")
            # Considere adicionar lógica aqui para atualizar status no frontend para o lote inteiro se o login falhar
            if driver_thread:
                 driver_thread.quit()
            return # Sai da thread se o login falhou

        # *** REMOVIDO: Leitura do CSV aqui não é mais necessária ***
        # df_lote = pd.read_csv(io.StringIO(conteudo_csv_lote)) # <-- Esta linha foi removida

        # *** ALTERADO: Itera diretamente sobre o DataFrame lote_df recebido ***
        # NOTA: Se a função chamadora (iniciar_macro_multi_thread) já fatiou o DataFrame
        # *pulando o cabeçalho* antes de passar o lote para cá, então este loop está correto.
        # Se o cabeçalho ainda puder vir no primeiro lote, a lógica precisaria de ajuste.
        for index, row in lote_df.iterrows(): # <-- Iterando sobre o DataFrame lote_df recebido

            # Lógica de Pausa e Parada - Mantida
            if parar_macro_event.is_set():
                print(f"Thread {threading.current_thread().name}: Sinal de parada recebido.")
                break # Sai do loop de processamento do lote

            if macro_pausada:
                print(f"Thread {threading.current_thread().name}: Macro pausada. Aguardando para continuar...")
                pausa_event.wait()
                pausa_event.clear()
                print(f"Thread {threading.current_thread().name}: Macro continuando...")

            # --- ALTERADO: Pega o ID da OS usando o NOME da coluna ---
            # Pega o valor da linha 'row' usando o nome da coluna 'coluna_os_nome'
            # Converte para string para garantir que funciona com send_keys se necessário
            id_os = str(row[coluna_os_nome]) # <-- Acesso agora é pelo nome da coluna
            # ----------------------------------------------------

            print(f"Thread {threading.current_thread().name}: Processando OS: {id_os}")

            # Lógica de Cálculo de Tempo - Mantida
            tempo_inicio = time.time()
            # eel.atualizar_status_os - Mantida (atualiza a OS que está sendo processada)
            eel.atualizar_status_os(id_os, total_os_processadas, total_os_a_processar, -1, "processando...")()

            # Chamada da Macro - Mantida
            resultado = macro_thread(driver_thread, wait_thread, id_os)

            # Lógica de Cálculo de Tempo - Mantida
            tempo_fim = time.time()
            tempo_processamento = tempo_fim - tempo_inicio
            with lock_tempos:
                tempos_processamento.append(tempo_processamento)

            # Cálculo e Atualização de Tempo Restante - Mantido
            tempo_restante = calcular_tempo_restante(total_os_processadas + 1, total_os_a_processar, tempos_processamento)
            print(f"Tempo restante estimado: {tempo_restante}")
            eel.atualizar_tempo_restante_js(tempo_restante)()

            # Lógica de Inserção no Banco e Atualização de Contadores/Frontend - Mantida
            if resultado:
                 fornecimento_wfm, _, str_status_site = resultado # Ignora o valor_os retornado pela macro se for o mesmo id_os

                 inserir_dados_banco(id_os, fornecimento_wfm, str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario)

                 with lock_processadas:
                     total_os_processadas += 1
                     eel.atualizar_status_os(id_os, total_os_processadas, total_os_a_processar, -1, str_status_site)()
                 print(f"Thread {threading.current_thread().name}: OS {id_os} processada com sucesso. Status: {str_status_site}")
            else:
                 # Lógica para OS que falhou - Mantida
                 with lock_processadas:
                     total_os_processadas += 1
                     eel.atualizar_status_os(id_os, total_os_processadas, total_os_a_processar, -1, "erro na automacao")()
                 print(f"Thread {threading.current_thread().name}: OS {id_os} falhou na automação.")

            time.sleep(0.5) # Pequena pausa - Mantida

    except Exception as e:
        # Tratamento de Erros - Mantido
        print(f"Thread {threading.current_thread().name}: Erro fatal ao processar lote: {e}")
        # Lógica para lidar com OSs restantes em caso de erro fatal no lote pode ser adicionada aqui se necessário.
    finally:
        # Bloco Final - Mantido (Fecha o navegador)
        if driver_thread:
            driver_thread.quit()
            print(f"Thread {threading.current_thread().name}: Navegador fechado.")


@eel.expose
def iniciar_macro_multi_thread(conteudo_arquivo, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario, num_threads=3):
    """
    Inicia a macro multi-thread. Lê o arquivo (CSV ou Excel), encontra a coluna da OS
    e distribui o processamento por threads.
    """
    global total_os_processadas, total_os_a_processar, tempos_processamento
    total_os_processadas = 0
    total_os_a_processar = 0
    tempos_processamento = [] # Reinicia a lista de tempos a cada execução
    parar_macro_event.clear()

    df = None # Inicializa o DataFrame
    coluna_os_nome = None # Variável para guardar o nome da coluna da OS

    try:
        if tipo_arquivo == 'csv':
            print(f"Lendo arquivo CSV: {nome_arquivo}")
            # Lê o CSV do conteúdo recebido como string
            df = pd.read_csv(io.StringIO(conteudo_arquivo))

        elif tipo_arquivo == 'excel':
            print(f"Lendo arquivo Excel: {nome_arquivo}")
            # O frontend envia Excel como Base64. Precisamos decodificar para bytes
            try:
                # Remove possível prefixo de Data URL se houver (ex: 'data:...')
                if ';' in conteudo_arquivo and ',' in conteudo_arquivo:
                     header, encoded = conteudo_arquivo.split(',', 1)
                else:
                     encoded = conteudo_arquivo

                decoded_content = base64.b64decode(encoded)
                # Lê o Excel do conteúdo decodificado (como bytes)
                df = pd.read_excel(io.BytesIO(decoded_content))
            except Exception as e:
                 return {"status": "erro", "mensagem": f"Erro ao decodificar/ler arquivo Excel: {e}"}

        else:
            # Este caso não deve ocorrer se o frontend só envia 'csv' ou 'excel'
            return {"status": "erro", "mensagem": f"Erro: Tipo de arquivo não suportado ({tipo_arquivo})."}

        # --- Lógica para encontrar a coluna da OS ---
        # Converte os nomes das colunas para minúsculas para comparação sem diferenciar maiúsculas/minúsculas
        colunas_lower = [col.lower() for col in df.columns]

        if 'os' in colunas_lower:
            coluna_os_nome = df.columns[colunas_lower.index('os')] # Pega o nome original da coluna
        elif 'OS' in colunas_lower:
            coluna_os_nome = df.columns[colunas_lower.index('OS')] # Pega o nome original da coluna
        elif 'número os' in colunas_lower:
            coluna_os_nome = df.columns[colunas_lower.index('número os')] # Pega o nome original da coluna
        elif 'Número OS' in colunas_lower:
            coluna_os_nome = df.columns[colunas_lower.index('Número OS')] # Pega o nome original da coluna
        else:
            # Se nenhuma coluna de OS for encontrada, retorne um erro
            return {"status": "erro", "mensagem": "Erro: Coluna 'OS' ou 'Número OS' não encontrada no arquivo."}
        # ---------------------------------------------

        if df.empty:
            return {"status": "erro", "mensagem": "Erro: Arquivo vazio ou sem dados após a leitura."}

        # O número total de OSs é o número de linhas no DataFrame (excluindo o cabeçalho, pandas.read_csv/excel já faz isso)
        num_total_os = len(df) # Já tínhamos isso, mas agora funciona para CSV/Excel

        if num_total_os == 0:
             return {"status": "aviso", "mensagem": "Aviso: Nenhum dado para processar no arquivo."}


        print(f"Arquivo lido com sucesso. Total de OSs a processar: {num_total_os}. Coluna OS identificada: '{coluna_os_nome}'")

        # --- Divisão em lotes e início das threads ---
        tamanho_lote = (num_total_os + num_threads - 1) // num_threads
        threads = []

        for i in range(num_threads):
            inicio = i * tamanho_lote
            fim = min((i + 1) * tamanho_lote, num_total_os)

            if inicio >= fim: # Garante que não cria threads para lotes vazios
                continue

            lote_df = df.iloc[inicio:fim] # Divide o DataFrame em lotes


            thread = threading.Thread(target=processar_lote_thread,
                                     args=(lote_df, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario, num_total_os, coluna_os_nome), # <--- Passando o DataFrame do lote e o nome da coluna OS
                                     name=f"Thread-{i+1}")
            threads.append(thread)
            thread.start()

        return {"status": "sucesso", "mensagem": f"Arquivo '{nome_arquivo}' lido. Iniciando macro com {num_threads} threads."}

    except FileNotFoundError:
        return {"status": "erro", "mensagem": f"Erro: Arquivo '{nome_arquivo}' não encontrado."}
    except pd.errors.EmptyDataError:
         return {"status": "aviso", "mensagem": f"Aviso: Arquivo '{nome_arquivo}' está vazio."}
    except pd.errors.ParserError as e:
        return {"status": "erro", "mensagem": f"Erro ao analisar arquivo '{nome_arquivo}': {e}. Verifique o formato."}
    except Exception as e:
        # Captura outros erros inesperados durante a leitura ou processamento inicial
        print(f"Erro inesperado em iniciar_macro_multi_thread: {e}")
        return {"status": "erro", "mensagem": f"Erro interno ao iniciar macro: {e}"}





