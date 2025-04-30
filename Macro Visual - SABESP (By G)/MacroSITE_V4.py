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
import datetime
from dateutil.relativedelta import relativedelta
import io
import eel
import threading
import sys
import mysql.connector
import pandas as pd
import openpyxl 
import base64
from threading import Event


# Variáveis globais para o driver e wait
driver = None
wait = None

eel.init('web')

macro_pausada = False
pausa_event = threading.Event() # Usar um evento para controlar a pausa

@eel.expose
def pausar_macro_backend():
    global macro_pausada
    macro_pausada = True
    print("Macro solicitada para pausar.")

@eel.expose
def continuar_macro_backend():
    global macro_pausada
    print("continuar_macro_backend() foi chamada.") # ADICIONE ESTE LOG
    macro_pausada = False
    print(f"macro_pausada agora é: {macro_pausada}") # ADICIONE ESTE LOG
    pausa_event.set() # Sinaliza para continuar
    print("pausa_event.set() foi chamado.") # ADICIONE ESTE LOG
    print("Macro solicitada para continuar.")
    
macro_rodando = False
parar_macro_event = threading.Event() # Usar um evento para controlar a parada

@eel.expose
def parar_macro_backend():
    global macro_rodando, parar_macro_event, driver
    print("Solicitação para parar a macro e encerrar a aplicação.")
    macro_rodando = False
    parar_macro_event.set() # Sinaliza para a macro parar

    # Tentar fechar o navegador Selenium se estiver aberto
    if driver:
        try:
            driver.quit()
            print("Navegador Selenium fechado.")
        except Exception as e:
            print(f"Erro ao tentar fechar o navegador: {e}")

    # Encerrar a aplicação Eel (e consequentemente o script Python)
    eel.close_window()
    sys.exit() # Encerra o script Python

@eel.expose
def iniciar_macro_com_arquivo(conteudo_arquivo, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario):
    global driver, wait, macro_pausada, pausa_event

    tempo_inicial_geral = datetime.datetime.now() # Captura o tempo de início
    mensagem_erro = None  # Inicializa a variável para mensagens de erro

    try:
        if tipo_arquivo == 'csv':
            df = pd.read_csv(io.StringIO(conteudo_arquivo), sep=';', encoding='utf-8')
        elif tipo_arquivo == 'excel':
            try:
                decoded_bytes = base64.b64decode(conteudo_arquivo)
                excel_file = io.BytesIO(decoded_bytes)
                df = pd.read_excel(excel_file, engine='openpyxl')
            except Exception as e:
                mensagem_erro = f"Erro ao ler o arquivo Excel: {e}"
                return {"status": "erro", "mensagem": mensagem_erro}
        else:
            mensagem_erro = "Tipo de arquivo não suportado."
            return {"status": "erro", "mensagem": mensagem_erro}

        print(f"Colunas encontradas no DataFrame: {df.columns}") # ADICIONADO PARA DEBUG

        if df.empty:
            mensagem_erro = "Erro: Arquivo vazio."
        else:
            coluna_os_encontrada = False
            coluna_os_nome = None
            for col in df.columns:
                if col.strip().lower() == "os":
                    coluna_os_nome = col
                    coluna_os_encontrada = True
                    break

            if not coluna_os_encontrada:
                mensagem_erro = f"Não foi encontrada nenhuma coluna com o nome 'OS' (após remover espaços)."
            else:
                if coluna_os_nome != 'OS':
                    df.rename(columns={coluna_os_nome: 'OS'}, inplace=True)

                login_status = login(login_usuario, senha_usuario)
                if login_status:
                    indices_valores = df['OS'].tolist() # Acessa a coluna 'OS'
                    total_processar = len(indices_valores)
                    os_processadas_com_sucesso = 0 # Inicializa o contador de OS processadas
                    print(f"Total de valores para processar: {total_processar}")
                    tempos_processamento = []
                    n_itens_para_media = 5   # Usar os últimos 5 tempos para calcular a média

                    for idx, id_os in enumerate(indices_valores):
                        # Verificar se a macro está pausada
                        if macro_pausada:
                            print(f"Macro pausada no item {idx + 1}. Aguardando para continuar...")
                            pausa_event.wait() # Bloqueia a execução até que pausa_event.set() seja chamado
                            pausa_event.clear() # Limpa o evento para a próxima pausa
                            print(f"Macro continuando do item {idx + 1}.")

                        tempo_inicial_item = datetime.datetime.now()
                        print(f"Processando OS {id_os} ({idx + 1}/{total_processar})")
                        resultado = macro(id_os)
                        print("Função macro retornou:", resultado)
                        if resultado:
                            fornecimento_wfm, valor, str_status_site = resultado
                            # inserir_dados_banco(valor, fornecimento_wfm, str_status_site, nome_arquivo, tipo_arquivo, identificador_usuario) # Use o identificador aqui
                            os_processadas_com_sucesso += 1 # Incrementa o contador

                        tempo_final_item = datetime.datetime.now()
                        tempo_processamento = (tempo_final_item - tempo_inicial_item).total_seconds()
                        tempos_processamento.append(tempo_processamento)

                        if len(tempos_processamento) > n_itens_para_media:
                            tempos_processamento.pop(0)     # Remove o tempo mais antigo

                        media_tempo_por_item = sum(tempos_processamento) / len(tempos_processamento) if tempos_processamento else 0
                        itens_restantes = total_processar - (idx + 1)
                        tempo_restante_segundos = media_tempo_por_item * itens_restantes
                        tempo_restante_formatado = formatar_tempo(tempo_restante_segundos)

                        porcentagem_concluida = round(((float(idx + 1)) / total_processar) * 100) if total_processar > 0 else 0

                        print(f"DEBUG: item_atual: {idx + 1}, total_processar: {total_processar}, porcentagem_calculada: {porcentagem_concluida}, tempo_estimado: {tempo_restante_formatado}")
                        print(f"**ANTES de chamar atualizar_status_os: OS={id_os}, item={idx + 1}, total={total_processar}, porcentagem={porcentagem_concluida}, tempo_estimado={tempo_restante_formatado}**")
                        try:
                            eel.atualizar_status_os(id_os, idx + 1, total_processar, porcentagem_concluida, tempo_restante_formatado)()
                        except Exception as e:
                            print(f"**ERRO ao chamar atualizar_status_os: {e}**")
                        print("**DEPOIS de tentar chamar atualizar_status_os**")

                        restantes = total_processar - (idx + 1)
                        print(f"Valores restantes para processar: {restantes}")

                        time.sleep(0.5)

                    tempo_final_geral = datetime.datetime.now() # Captura o tempo de término
                    tempo_total = tempo_final_geral - tempo_inicial_geral

                    total_segundos = int(tempo_total.total_seconds())
                    total_minutos = int(tempo_total.total_seconds() // 60)
                    total_horas = int(total_minutos // 60)

                    if total_segundos < 60:
                        tempo_total_formatado_str = f"{total_segundos} segundos"
                    elif total_minutos < 60:
                        tempo_total_formatado_str = f"{total_minutos} minutos e {total_segundos % 60} segundos"
                    else:
                        tempo_total_formatado_str = f"{total_horas} horas e {total_minutos % 60} minutos"

                    # Envia os dados de conclusão para o frontend
                    eel.exibir_conclusao_site(
                        tempo_inicial_geral.strftime("%H:%M"),
                        tempo_inicial_geral.strftime("%d/%m"),
                        tempo_final_geral.strftime("%H:%M"),
                        tempo_final_geral.strftime("%d/%m"),
                        os_processadas_com_sucesso,
                        tempo_total_formatado_str,
                        nome_arquivo

                    )()

                    print("----------------------------------")
                    print("Começo da operação:", tempo_inicial_geral.strftime("%H:%M -- %d/%m"))
                    print("Termino da operação:", tempo_final_geral.strftime("%H:%M -- %d/%m"))
                    print(f"Total de OS processadas ({os_processadas_com_sucesso})")
                    print(f"Tempo total da operação: {tempo_total_formatado_str}")
                    print("----------------------------------")

                    print("Macro concluída com sucesso.")
                    return {"status": "sucesso"}
                else:
                    mensagem_erro = "Login ou senha inexistentes. Verifique e tente novamente."

    except pd.errors.EmptyDataError:
        mensagem_erro = "Erro: Arquivo vazio."
    except Exception as e:
        mensagem_erro = f"Erro ao processar o arquivo e executar a macro: {str(e)}"
    finally:
        if 'driver' in globals() and driver:
            try:
                driver.quit()
                print("Navegador fechado (finally).")
            except Exception as e:
                print(f"Erro ao fechar o driver no finally: {e}")

    if mensagem_erro:
        print(mensagem_erro)
        return {"status": "erro", "mensagem": mensagem_erro}
    return {"status": "sucesso"} # Retorna sucesso se não houve erro e não houve mensagem de erro

def inserir_dados_banco(os_valor, fornecimento_valor, resultado_site_valor, nome_arquivo, tipo_arquivo, autor):
    db_user = 'root'
    db_password = 'SB28@sabesp'
    db_host = '10.51.109.123'  # Verifique se o IP está correto
    db_name = 'pendlist'
    connection = None  # Inicializa a variável de conexão fora do try

    try:
        # Estabelecendo a conexão com o MySQL
        connection = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )

        if connection.is_connected():
            print("Conexão com o banco de dados bem-sucedida!")

        # Criar um cursor para executar comandos SQL
        cursor = connection.cursor()

        # Comando SQL para inserção **(ADICIONEI A COLUNA 'autor')**
        sql = """
        INSERT INTO tb_consulta_site(Os, fornecimento, resultado_site, nome_arquivo, tipo_arquivo, autor)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        # Valores a serem inseridos **(ADICIONEI A VARIÁVEL 'autor')**
        values = (os_valor, fornecimento_valor, resultado_site_valor, nome_arquivo, tipo_arquivo, autor)
        print(os_valor, fornecimento_valor, resultado_site_valor, nome_arquivo, tipo_arquivo, autor) # ADICIONADO PARA DEBUG

        # Executar o comando SQL
        cursor.execute(sql, values)

        # Confirmar a transação
        connection.commit()
        print(f"Dados inseridos com sucesso! OS: {os_valor}, Fornecimento: {fornecimento_valor}, Resultado Site: {resultado_site_valor}, Autor: {autor}")

    except mysql.connector.Error as e:
        print(f"Erro ao inserir os dados: {e}")
        if connection and connection.is_connected():
            connection.rollback()   # Em caso de erro, desfaz as alterações
    finally:
        # Fechar a conexão
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("Conexão com o banco de dados fechada.")
            
            
def formatar_tempo(segundos):
    horas = int(segundos // 3600)
    minutos = int((segundos % 3600) // 60)
    seg = int(segundos % 60)
    return f"{horas:02d}:{minutos:02d}:{seg:02d}"


def reiniciar_macro(valor):
    time.sleep(1)
    global driver, wait
    xpath_principal = '//*[@id="box"]/div[3]/div/div/div/div/div[3]'
    xpath_alternativo = '//*[@id="box"]/div[3]/div/div/div/div/div[2]'

    print("Pressionando F5 para reiniciar o navegador...")
    driver.refresh()  # Recarrega a página
    WebDriverWait(driver, 30).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )  # Aguarda o carregamento completo da página
    print("Página recarregada com sucesso.")

    driver.switch_to.default_content()
    print("Alterando para o iframe principal...")
    wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))
    print("Iframe carregado com sucesso!")

    print("Tentando localizar 'nova instância'...")
    try:
        novainstanciaprincipal = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, xpath_principal))
        )
        novainstanciaprincipal.click()
        print("Clicando em nova instância verde (principal).")
    except TimeoutException:
        print("Elemento principal não encontrado, tentando o alternativo...")
        try:
            time.sleep(1)
            novainstancia = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.XPATH, xpath_alternativo))
            )
            novainstancia.click()
            print("Clicando em nova instância vermelha (alternativa).")
        except TimeoutException:
            print("Nenhuma das opções foi encontrada.")
            if driver:
                driver.quit()
            return login()

    try:
        time.sleep(1)
        print("Tentando clicar em 'planejamento'...")
        planejamento = WebDriverWait(driver, 60).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
        )
        planejamento.click()
        print("Clique em 'planejamento' bem-sucedido.")

    except StaleElementReferenceException:
        print("Elemento 'planejamento' recriado no DOM. Recarregando a página...")
        driver.refresh()  # Recarrega o navegador
        WebDriverWait(driver, 30).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        driver.switch_to.default_content()
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))

    except TimeoutException:
        print("Elemento 'planejamento' não encontrado dentro do limite de tempo. Reiniciando a macro...")

    try:
        time.sleep(1)
        print("Tentando clicar em 'busca execução'...")
        busca_execucao = WebDriverWait(driver, 60).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        busca_execucao.click()
        print("Clique em 'busca execução' bem-sucedido.")

    except StaleElementReferenceException:
        print("Elemento 'busca execução' recriado no DOM. Recarregando a página...")
        driver.refresh()
        WebDriverWait(driver, 30).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        driver.switch_to.default_content()
        wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))

    except TimeoutException:
        print("Elemento 'busca execução' não encontrado dentro do tempo limite. Reiniciando a macro...")

def armazenar_dados_proc_final(fornecimento, os_numero, status):
    pde_lista = [{"FORNECIMENTO": fornecimento, "OS": os_numero, "RESULTADO": status}]
    output_file = r"ResultadoSITE.csv"
    df = pd.DataFrame(pde_lista)
    if os.path.exists(output_file):
        df.to_csv(output_file, mode='a', header=False, index=False, encoding='UTF-8-SIG', sep=';')
    else:
        df.to_csv(output_file, index=False, encoding='UTF-8-SIG', sep=';')

def apagar_processada():
    """
    Lê o arquivo 'template.csv', remove a primeira linha e salva as alterações.
    """
    arquivo = 'template.csv'  # Caminho do arquivo template.csv

    if os.path.exists(arquivo):
        try:
            df = pd.read_csv(arquivo)  # Lê o arquivo CSV
            if not df.empty:
                df = df.iloc[1:]  # Remove a primeira linha
                df.to_csv(arquivo, index=False)  # Salva as alterações no arquivo
            else:
                print(f"O arquivo {arquivo} está vazio.")
        except FileNotFoundError:
            print(f"Arquivo {arquivo} não encontrado.")
        except Exception as e:
            print(f"Ocorreu um erro ao remover o primeiro PDE: {e}")
    else:
        print(f"Arquivo {arquivo} não encontrado.")
        
def login(login_digitado, senha_digitada):
    global driver, wait, usuario_logado_identificador # Adicione a variável global aqui
    prefs = {"profile.default_content_setting_values.notifications": 2}  # Bloqueia notificações do navegador
    options = Options()
    options.add_argument("--headless") # Deixa o navegador invisivel
    options.add_argument("--disable-gpu") # Deixa o navegador invisivel
    # options.add_argument("--start-fullscreen")   # Abre em tela cheia

    driver = webdriver.ChromiumEdge(options=options)
    wait = WebDriverWait(driver, 10)

    driver.get('https://geoprd.sabesp.com.br/sabespwfm/')

    l_login = login_digitado   # Usando o valor passado como argumento
    s_senha = senha_digitada   # Usando o valor passado como argumento

    driver.maximize_window()

    try:   # Clicar no campo de nome de usuário
        # Ajuste as coordenadas conforme necessário

        driver.switch_to.frame(driver.find_element(By.NAME, "mainFrame"))
        time.sleep(2)
        username_field = driver.find_element(By.CSS_SELECTOR, "input[id='USER']")   # Altere "username" para o ID correto do campo de usuário
        password_field = driver.find_element(By.CSS_SELECTOR, 'input[id="INPUTPASS"]')   # Altere "password" para o ID correto do campo de senha
        login_button = driver.find_element("id", "submbtn")   # Altere "login-button" para o ID correto do botão de login

        # Preencher os campos e enviar o formulário
        username_field.send_keys(l_login)
        password_field.send_keys(s_senha)
        login_button.click()

        time.sleep(2)

        planejamento = WebDriverWait(driver, 120).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]')))
        planejamento.click()

        busca_execucao = WebDriverWait(driver, 120).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]')))
        busca_execucao.click()
        return True # Retorna True em caso de sucesso

    except Exception as e:
        print(f"Erro durante o login: {str(e)}")
        return False # Retorna False em caso de falha
    
def macro(valor):
    global driver, wait

    time.sleep(1)
    try:
        busca_execucao = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        driver.execute_script("arguments[0].click();", busca_execucao)
        # print("Elemento 'busca_execucao' clicado.")

    except TimeoutException:
        # print("Elementos não encontrados ou não visíveis. Passando para o próximo ponto.")
        planejamento = WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
        )
        planejamento.click()

        time.sleep(5)
        busca_execucao = WebDriverWait(driver, 30).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        driver.execute_script("arguments[0].click();", busca_execucao)
        time.sleep(5)
        # Aqui você pode adicionar o código para o próximo ponto

    time.sleep(0.5)
    while True:
        try:
            status_avaliacao = WebDriverWait(driver, 20).until(EC.presence_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[9]/tr[1]/td/span/img')))
            driver.execute_script("arguments[0].click();", status_avaliacao)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            com_resultado = WebDriverWait(driver, 20).until(EC.presence_of_element_located(
                (By.XPATH, '//select[@name="_lyXWFMRAGMSTATOINIVIO"]')))
            select_neta = Select(com_resultado)
            select_neta.select_by_index(2)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)
        
    time.sleep(0.5)
    while True:
        try:
            dados_os = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[13]/tr[1]/td/span/img')))
            dados_os.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)
        
    time.sleep(0.5)
    while True:
        try:
            numero_os = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[13]/tr[3]/td[2]/table/tbody/tr/td/input')))
            numero_os.click()
            numero_os.clear()
            numero_os.send_keys(str(valor))
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)
        
    time.sleep(0.5)
    while True:
        try:
            contrato_x = WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[3]/tr[11]/td[2]/table/tbody/tr/td[3]/img[2]')))
            driver.execute_script("arguments[0].click();", contrato_x)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)
        
    time.sleep(0.5)
    while True:
        try:
            WebDriverWait(driver, 20).until(EC.invisibility_of_element_located((By.ID, "transpdiv-2")))
            botao_buscar = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[3]/tbody/tr/td/table/tbody/tr/td[3]/button')))
            botao_buscar.click()
            break  # sair do loop se a ação for bem-sucedida
        except (TimeoutException, StaleElementReferenceException, ElementClickInterceptedException):
            pass

    time.sleep(0.5)
    while True:
        try:
            linhas_laranja = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[3]/div[2]/div/div/div/table/tbody/tr[2]/td[1]/div[1]/div/div/img')))
            linhas_laranja.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)
        
    time.sleep(0.5)
    while True:
        try:
            resultado_intervencao = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Resultado Intervenção')]"))
            )
            resultado_intervencao.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            resultado_intervencao = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Resultado Intervenção')]"))
            )
            driver.execute_script("arguments[0].click();", resultado_intervencao)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            select_element = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.XPATH, "//select[@name='_lyXSABARODID_XDABLPDE']"))
            )
            if select_element.is_displayed():
                str_status_site = select_element.text
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            dtclientes = WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.XPATH, '//*[@id="MTT-mfDettagliUtenza-outpututenza"]')))
            dtclientes.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            forn_usuario = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[1]/td/div/div[2]/div[2]/div/div[1]/table/tbody/tr/td[1]/table/tbody/tr/td')))

            if forn_usuario.is_displayed():
                fornecimento_wfm = forn_usuario.text
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            botao_fecha = WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[3]/div[2]/div[6]')))
            driver.execute_script("arguments[0].click();", botao_fecha)
            break
        except (TimeoutException, StaleElementReferenceException):
            reiniciar_macro(valor)
            return macro(valor)

    time.sleep(0.5)
    while True:
        try:
            WebDriverWait(driver, 120).until(EC.invisibility_of_element_located((By.ID, "transpdiv-0")))
            busca_execucao = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
            time.sleep(2)
            busca_execucao.click()
            break
        except (TimeoutException, StaleElementReferenceException):
            pass
        except Exception:
            i=0
            
    
    armazenar_dados_proc_final(fornecimento_wfm, valor, str_status_site)
    apagar_processada()
    
    

    return fornecimento_wfm, valor, str_status_site