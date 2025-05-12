import os
import time
import pandas as pd
import io
import base64
import sys
import threading # Manter para threading.current_thread().name no logging, mesmo que seja single-thread
import logging
from datetime import datetime

# Selenium imports
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, ElementClickInterceptedException, NoSuchElementException

# Database imports
import pymysql
import pymysql.cursors

# Eel import
import eel

# Adicionar esta importação para tratar o erro específico de Base64
from binascii import Error as Base64Error # <-- LINHA ADICIONADA/VERIFICADA

eel.init('web') # Certifique-se que 'web' é o nome da pasta que contém seus arquivos HTML/JS

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(threadName)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("macro_site_single_thread.log"), # Salva logs em arquivo
                        logging.StreamHandler(sys.stdout) # Imprime logs no console
                    ])

# Flag global para evitar múltiplas execuções simultâneas
macro_rodando = False

# --- Funções Expostas ao Eel (para comunicação com o Frontend) ---

@eel.expose
def display_macro_error_frontend(errorMessage):
    """
    Exposta ao Eel para exibir mensagens de erro críticas no frontend.
    A implementação real está no JavaScript do frontend.
    """
    logging.error(f"Enviando erro para o frontend: {errorMessage}")
    # O frontend irá capturar esta chamada e exibir o erro na UI.

@eel.expose
def display_macro_completion_frontend(completionMessage):
    """
    Exposta ao Eel para exibir mensagens de conclusão da macro no frontend.
    A implementação real está no JavaScript do frontend.
    """
    logging.info(f"Enviando mensagem de conclusão para o frontend: {completionMessage}")
    # O frontend irá capturar esta chamada e exibir a mensagem na UI.

@eel.expose
def atualizar_status_os(os_number, processed_count, total_count, status_code, status_message):
    """
    Exposta ao Eel para atualizar o status de uma OS individual no frontend.
    """
    logging.info(f"Atualizando status OS: {os_number}, Processadas: {processed_count}/{total_count}, Status: {status_message}")
    # O frontend irá capturar esta chamada e atualizar a barra de progresso e status.

@eel.expose
def atualizar_tempo_restante_js(time_remaining_formatted):
    """
    Exposta ao Eel para atualizar o tempo restante estimado no frontend.
    """
    logging.info(f"Tempo restante estimado: {time_remaining_formatted}")
    # O frontend irá capturar esta chamada e exibir o tempo restante.

# --- Funções Auxiliares ---

def formatar_tempo(segundos):
    """Formata segundos em HH:MM:SS."""
    horas = int(segundos // 3600)
    minutos = int((segundos % 3600) // 60)
    seg = int(segundos % 60)
    return f"{horas:02d}:{minutos:02d}:{seg:02d}"

def calcular_tempo_restante(total_processadas, total_a_processar, lista_tempos):
    """Calcula o tempo restante estimado baseado na média dos tempos de processamento."""
    if total_processadas > 0 and total_a_processar > total_processadas:
        if lista_tempos: # Certifica-se que a lista não está vazia
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
    db_host = '10.51.109.123' # Verifique se o IP está correto
    db_name = 'pendlist'
    connection = None
    cursor = None

    try:
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        logging.info(f"Conexão com o banco de dados bem-sucedida para inserção!")

        cursor = connection.cursor(pymysql.cursors.DictCursor)

        sql = """
        INSERT INTO tb_consulta_site(Os, fornecimento, resultado_site, tipo_arquivo, nome_arquivo, autor)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (valor, fornecimento_wfm, str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario)
        cursor.execute(sql, values)
        connection.commit()
        logging.info(f"Dados inseridos com sucesso! OS: {valor}, Fornecimento: {fornecimento_wfm}, Resultado Site: {str_status_site}, Tipo do arquivo: {tipo_arquivo}, nome do arquivo {nome_arquivo}, Autor: {identificador_usuario}")

    except pymysql.Error as e:
        logging.error(f"Erro do banco de dados (PyMySQL) ao inserir os dados: {e}")
        logging.exception(f"Detalhes do erro do banco de dados (PyMySQL) ao inserir dados:")
        if connection:
            connection.rollback() # Reverter transação em caso de erro
    except Exception as e:
        logging.error(f"Ocorreu um erro inesperado na função inserir_dados_banco: {e}")
        logging.exception(f"Detalhes do erro inesperado na função inserir_dados_banco:")
    finally:
        if connection:
            if cursor:
                cursor.close()
            connection.close()
            logging.info(f"Conexão com o banco de dados fechada após inserção.")


def reiniciar_macro_state(driver_thread, wait_thread):
    """
    Tenta reiniciar o estado do navegador e voltar para a tela de 'busca execução'.
    Retorna True se conseguir, False caso contrário.
    """
    logging.info("Pressionando F5 para reiniciar o navegador e restaurar o estado...")
    try:
        driver_thread.refresh()
        wait_thread.until(lambda d: d.execute_script("return document.readyState") == "complete")
        logging.info("Página recarregada com sucesso.")

        driver_thread.switch_to.default_content()
        logging.info("Alterando para o iframe principal...")
        wait_thread.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))
        logging.info("Iframe carregado com sucesso!")

        xpath_principal_nova_instancia = '//*[@id="box"]/div[3]/div/div/div/div/div[3]'
        xpath_alternativo_nova_instancia = '//*[@id="box"]/div[3]/div/div/div/div/div[2]'

        logging.info("Tentando localizar 'nova instância'...")
        try:
            nova_instancia_btn = wait_thread.until(
                EC.visibility_of_element_located((By.XPATH, xpath_principal_nova_instancia))
            )
            nova_instancia_btn.click()
            logging.info("Clicando em nova instância verde (principal).")
        except TimeoutException:
            logging.warning("Elemento 'nova instância' principal não encontrado, tentando o alternativo...")
            try:
                nova_instancia_btn = wait_thread.until(
                    EC.visibility_of_element_located((By.XPATH, xpath_alternativo_nova_instancia))
                )
                nova_instancia_btn.click()
                logging.info("Clicando em nova instância vermelha (alternativa).")
            except TimeoutException:
                logging.error("Nenhuma das opções de 'nova instância' foi encontrada após recarregar. Falha na recuperação.")
                return False # Indica falha na recuperação

        # Clicar em 'planejamento'
        logging.info("Tentando clicar em 'planejamento'...")
        planejamento = wait_thread.until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
        )
        # Usando execute_script para cliques mais robustos em elementos que podem estar "escondidos" ou terem overlays
        driver_thread.execute_script("arguments[0].click();", planejamento)
        logging.info("Clique em 'planejamento' bem-sucedido.")
        time.sleep(0.5) # Pequena pausa para permitir a renderização

        # Clicar em 'busca execução'
        logging.info("Tentando clicar em 'busca execução'...")
        busca_execucao = wait_thread.until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        driver_thread.execute_script("arguments[0].click();", busca_execucao)
        logging.info("Clique em 'busca execução' bem-sucedido.")
        time.sleep(0.5) # Pequena pausa para permitir a renderização

        return True # Recuperação bem-sucedida

    except Exception as e:
        logging.error(f"Erro crítico durante a tentativa de reiniciar o estado do navegador: {e}")
        logging.exception("Detalhes do erro crítico em reiniciar_macro_state:")
        return False

def armazenar_dados_proc_final_thread(fornecimento, os_numero, status):
    """
    Armazena os dados de processamento final em um arquivo CSV.
    """
    pde_lista = [{"FORNECIMENTO": fornecimento, "OS": os_numero, "RESULTADO": status}]
    df = pd.DataFrame(pde_lista)

    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Macro SITE')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")

    try:
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Estrutura de pastas criada ou já existente: {output_dir}")
    except Exception as e:
        logging.error(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")

    output_file_path = os.path.join(output_dir, f'ResultadoSITE{data_formatada}.csv')

    file_exists = os.path.exists(output_file_path)

    try:
        if file_exists:
            df.to_csv(output_file_path, mode='a', header=False, index=False, encoding='UTF-8-SIG', sep=';')
            logging.info(f"Dados anexados ao arquivo: {output_file_path}")
        else:
            df.to_csv(output_file_path, index=False, encoding='UTF-8-SIG', sep=';')
            logging.info(f"Novo arquivo criado: {output_file_path}")
    except Exception as e:
        logging.error(f"Erro ao salvar os dados no arquivo CSV {output_file_path}: {e}")


def configure_browser_options():
    """Configura as opções do navegador para Edge."""
    options = Options()
    # Descomente a linha abaixo se quiser o navegador visível durante a execução
    # options.add_argument("--headless")
    # options.add_argument("--disable-gpu") # Geralmente usado com headless
    options.add_argument("--start-maximized") # Abre o navegador maximizado
    return options

def login_browser(driver_param, wait_param, login_digitado, senha_digitada):
    """
    Realiza o login no site WFM.
    Retorna True se o login for bem-sucedido, False caso contrário.
    """
    logging.info(f"Tentando login para o usuário: {login_digitado}")
    try:
        driver_param.get('https://geoprd.sabesp.com.br/sabespwfm/')
        driver_param.maximize_window()
        logging.info("Navegou para a URL e maximizou a janela.")

        wait_param.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, "mainFrame")))
        logging.info("Alternou para o iframe 'mainFrame'.")

        username_field = wait_param.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[id='USER']")))
        password_field = wait_param.until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'input[id="INPUTPASS"]')))
        login_button = wait_param.until(EC.element_to_be_clickable((By.ID, "submbtn")))

        username_field.send_keys(login_digitado)
        logging.info("Usuário digitado.")
        password_field.send_keys(senha_digitada)
        logging.info("Senha digitada.")

        login_button.click()
        logging.info("Botão de login clicado.")

        # Esperar por elementos que confirmam que o login foi bem-sucedido
        wait_param.until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))) # Planejamento
        wait_param.until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))) # Busca Execução
        logging.info("Elementos pós-login (Planejamento/Busca Execução) visíveis. Login bem-sucedido.")

        return True

    except TimeoutException as e:
        logging.error(f"Erro de tempo limite (Timeout) durante o login: {str(e)}")
        return False
    except StaleElementReferenceException as e:
        logging.error(f"Erro de referência de elemento obsoleto durante o login: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Erro inesperado durante o login: {str(e)}")
        return False

def execute_macro_logic(driver, wait, lote_df, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario, coluna_os_nome):
    """
    Contém a lógica principal de execução da macro para um DataFrame de OSs.
    Assume que o login já foi realizado.
    """
    total_os_processadas = 0
    tempos_processamento_lista = [] # Lista local para esta função
    total_os_a_processar = len(lote_df)

    logging.info(f"Iniciando processamento de {total_os_a_processar} OSs.")

    for index, row in lote_df.iterrows():
        tempo_inicio_os = time.time()
        valor_os = str(row[coluna_os_nome])

        logging.info(f"Processando OS: {valor_os}")

        # Atualiza o status no frontend para a OS atual
        eel.atualizar_status_os(valor_os, total_os_processadas, total_os_a_processar, -1, "processando...")()

        str_status_site = "Status não determinado/erro no processamento" # Mensagem de erro padrão

        try:
            # --- Lógica para garantir que a macro esteja na tela correta antes de cada busca ---
            driver.switch_to.default_content()
            wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))
            logging.info("Iframe 'mainFrame' focado para processar OS.")

            xpath_principal_nova_instancia = '//*[@id="box"]/div[3]/div/div/div/div/div[3]'
            xpath_alternativo_nova_instancia = '//*[@id="box"]/div[3]/div/div/div/div/div[2]'

            try:
                nova_instancia_btn = wait.until(
                    EC.visibility_of_element_located((By.XPATH, xpath_principal_nova_instancia))
                )
                nova_instancia_btn.click()
                logging.info("Clicando em 'nova instância' principal.")
            except TimeoutException:
                logging.warning("'nova instância' principal não encontrada, tentando alternativa.")
                nova_instancia_btn = wait.until(
                    EC.visibility_of_element_located((By.XPATH, xpath_alternativo_nova_instancia))
                )
                nova_instancia_btn.click()
                logging.info("Clicando em 'nova instância' alternativa.")

            # Clicar em 'planejamento'
            planejamento = wait.until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
            )
            driver.execute_script("arguments[0].click();", planejamento)
            logging.info("Clique em 'planejamento' bem-sucedido.")
            time.sleep(0.5)

            # Clicar em 'busca execução'
            busca_execucao = wait.until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
            driver.execute_script("arguments[0].click();", busca_execucao)
            logging.info("Clique em 'busca execução' bem-sucedido.")
            time.sleep(0.5)

            # Preencher o campo da OS
            campo_os = wait.until(
                EC.visibility_of_element_located((By.ID, 'txtNumeroOs'))
            )
            campo_os.clear()
            campo_os.send_keys(valor_os)
            logging.info(f"Campo OS preenchido com: {valor_os}")

            # Clicar no botão de 'Buscar'
            buscar_btn = wait.until(
                EC.element_to_be_clickable((By.ID, 'btnBuscar'))
            )
            buscar_btn.click()
            logging.info("Botão 'Buscar' clicado.")

            # Esperar pelo resultado do status
            try:
                status_element = wait.until(
                    EC.visibility_of_element_located((By.XPATH, '//*[@id="grdResult"]/div/div[2]/table/tbody/tr[1]/td[5]'))
                )
                str_status_site = status_element.text.strip()
                logging.info(f"Status do site para OS {valor_os}: {str_status_site}")
            except TimeoutException:
                logging.warning(f"Elemento de status não encontrado para OS {valor_os}. Pode não ter encontrado a OS.")
                str_status_site = "OS não encontrada/Status não determinado"

            fornecimento_wfm = row.get('FORNECIMENTO', 'N/A') # Pega o fornecimento se existir, senão 'N/A'
            inserir_dados_banco(valor_os, fornecimento_wfm, str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario)

        except (TimeoutException, StaleElementReferenceException, ElementClickInterceptedException, NoSuchElementException) as e:
            logging.error(f"Erro de automação na OS {valor_os}: {type(e).__name__} - {e}. Tentando reiniciar o estado do navegador.")
            str_status_site = f"Erro de automação: {type(e).__name__}"
            inserir_dados_banco(valor_os, row.get('FORNECIMENTO', 'N/A'), str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario)

            # Tenta reiniciar o estado do navegador. Se falhar, registra e continua para a próxima OS.
            if not reiniciar_macro_state(driver, wait):
                logging.error(f"Falha persistente na recuperação do navegador para OS {valor_os}. A macro pode não se recuperar adequadamente para as próximas OSs.")
                eel.display_macro_error_frontend(f"Erro persistente na OS {valor_os}. A macro pode estar em estado instável, mas continuará tentando.")()
                # Aqui você pode decidir se quer parar tudo ou continuar. Para robustez, continua.

        except Exception as e:
            logging.exception(f"Erro inesperado ao processar OS {valor_os}: {e}")
            str_status_site = f"Erro inesperado: {type(e).__name__}"
            inserir_dados_banco(valor_os, row.get('FORNECIMENTO', 'N/A'), str_status_site, tipo_arquivo, nome_arquivo, identificador_usuario)
            eel.display_macro_error_frontend(f"Erro fatal ao processar OS {valor_os}: {str(e)}. A macro será encerrada para evitar mais problemas.")()
            break # Quebra o loop de processamento das OSs devido a um erro fatal

        total_os_processadas += 1

        tempo_fim_os = time.time()
        tempo_processamento_os = tempo_fim_os - tempo_inicio_os
        tempos_processamento_lista.append(tempo_processamento_os)

        tempo_restante_formatado = calcular_tempo_restante(total_os_processadas, total_os_a_processar, tempos_processamento_lista)

        # Atualiza o frontend com o status e tempo restante
        eel.atualizar_status_os(valor_os, total_os_processadas, total_os_a_processar, -1, str_status_site)()
        eel.atualizar_tempo_restante_js(tempo_restante_formatado)()

        time.sleep(0.5) # Pequena pausa entre as OSs para evitar sobrecarga do site

    if total_os_processadas == total_os_a_processar:
        logging.info("Todas as OS foram processadas com sucesso!")
        eel.display_macro_completion_frontend("Processamento concluído com sucesso para todas as OS.")()
    else:
        logging.warning("Processamento de OSs interrompido ou com falhas. Verifique os logs para detalhes.")
        eel.display_macro_error_frontend("Processamento incompleto ou com erros. Verifique os logs.")()

    # Salvar os dados processados no arquivo final
    # Não é necessário chamar armazenar_dados_proc_final_thread aqui pois já está sendo chamado dentro do loop para cada OS.
    # Se você quiser um arquivo de resumo final diferente, implemente aqui.


@eel.expose
def iniciar_macro_single_thread(conteudo_arquivo_data_url, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario):
    """
    Ponto de entrada principal do frontend para iniciar a macro (single-threaded).
    """
    global macro_rodando

    if macro_rodando:
        logging.warning("Uma macro já está em execução. Nova solicitação ignorada.")
        return {"status": "erro", "message": "Uma macro já está em execução."}

    macro_rodando = True
    driver = None # Inicializa driver como None para garantir que seja fechado no finally

    try:
        df = None
        coluna_os_nome = 'OS' # Coluna padrão para a OS

        # --- INÍCIO DA MODIFICAÇÃO CRÍTICA ---
        # Extrai apenas a parte Base64 da Data URL
        base64_data_only = ""
        if ',' in conteudo_arquivo_data_url:
            # Divide a string no primeiro ',' para separar o cabeçalho dos dados Base64
            header, base64_data_only = conteudo_arquivo_data_url.split(',', 1)
        else:
            # Se não houver ',' (o que é inesperado para uma Data URL), assume que já é o Base64 puro
            base64_data_only = conteudo_arquivo_data_url
            logging.warning("Data URL inesperada sem ','. Tentando decodificar diretamente.")

        # Decodifica o arquivo enviado via base64 usando a parte extraída
        if tipo_arquivo == 'csv':
            conteudo_arquivo_str = base64.b64decode(base64_data_only).decode('utf-8')
            df = pd.read_csv(io.StringIO(conteudo_arquivo_str), sep=';', encoding='utf-8')
        elif tipo_arquivo == 'excel':
            conteudo_arquivo_bytes = base64.b64decode(base64_data_only)
            df = pd.read_excel(io.BytesIO(conteudo_arquivo_bytes))
        # --- FIM DA MODIFICAÇÃO CRÍTICA ---

        if df is None or df.empty:
            logging.error("O arquivo de entrada está vazio ou não pôde ser lido.")
            eel.display_macro_error_frontend("O arquivo de entrada está vazio ou inválido. Por favor, verifique o arquivo e tente novamente.")()
            return {"status": "erro", "message": "O arquivo de entrada está vazio ou inválido."}

        # Valida a coluna da OS
        if coluna_os_nome not in df.columns:
            alternativas_os = ['N_OS', 'NUMERO_OS', 'NumeroOs', 'Número da OS', "Número Os", "Número OS"]
            for alt_col in alternativas_os:
                if alt_col in df.columns:
                    coluna_os_nome = alt_col
                    logging.warning(f"Coluna '{alt_col}' encontrada e será usada como coluna de OS.")
                    break
            else:
                logging.error(f"Coluna de OS '{coluna_os_nome}' não encontrada e nenhuma alternativa válida. Colunas disponíveis: {df.columns.tolist()}")
                eel.display_macro_error_frontend(f"Coluna de OS '{coluna_os_nome}' ou suas alternativas não encontradas no arquivo. Colunas no arquivo: {df.columns.tolist()}")()
                return {"status": "erro", "message": f"Coluna de OS '{coluna_os_nome}' ou suas alternativas não encontradas no arquivo."}

        # Inicializa o WebDriver
        options = configure_browser_options()
        driver = webdriver.Edge(options=options) # Ou .Chrome(), .Firefox() etc.
        wait = WebDriverWait(driver, 60)
        logging.info("WebDriver inicializado para execução single-threaded.")

        # --- Realiza o login ---
        if not login_browser(driver, wait, login_usuario, senha_usuario):
            logging.error("Falha no login. Encerrando a macro.")
            eel.display_macro_error_frontend("Falha no login. Verifique suas credenciais ou a disponibilidade do site WFM.")()
            return {"status": "erro", "message": "Falha no login."}

        logging.info("Login bem-sucedido. Iniciando a lógica principal da macro.")

        # --- Executa a lógica principal da macro ---
        execute_macro_logic(driver, wait, df, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario, coluna_os_nome)

        return {"status": "concluido", "message": "Macro executada com sucesso (ou com erros que foram registrados)."}

    except Base64Error as e: # Tratamento específico para erros de Base64
        error_message = f"Erro de decodificação Base64: O formato do arquivo ou sua codificação Base64 é inválida. Detalhes: {e}"
        logging.error(f"CRITICAL ERROR IN BACKEND: {error_message}")
        eel.display_macro_error_frontend(f"Ocorreu um erro crítico no backend: {error_message}. A macro foi interrompida.")()
        return {"status": "erro", "message": error_message}
    except Exception as e:
        logging.exception("Erro crítico ao iniciar ou executar a macro no backend (single-threaded):")
        eel.display_macro_error_frontend(f"Ocorreu um erro crítico no backend: {str(e)}. A macro foi interrompida.")()
        return {"status": "erro", "message": f"Erro crítico no backend: {str(e)}"}
    finally:
        if driver:
            driver.quit()
            logging.info("WebDriver encerrado.")
        macro_rodando = False # Reseta a flag quando a macro termina ou falha