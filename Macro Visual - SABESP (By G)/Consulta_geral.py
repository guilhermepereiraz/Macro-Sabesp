import pandas as pd
from selenium.common.exceptions import StaleElementReferenceException, NoSuchElementException, WebDriverException, TimeoutException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium import webdriver
from datetime import datetime
import time
import os
from selenium.webdriver.support.ui import Select
import threading
import numpy as np
import sys
import traceback
import eel
import logging
from io import StringIO, BytesIO
import base64
import pymysql # USANDO PyMySQL
import pymysql.cursors

# Variáveis globais para contagem e tempo
total_processar = 0
processados = 0
erros = 0
tempos_processamento = [] # Lista para armazenar o tempo de cada item

# Locks para acesso thread-safe a recursos compartilhados
file_lock = threading.Lock()
counter_lock = threading.Lock()
lock_tempos = threading.Lock() # Lock específico para a lista de tempos

# Evento para sinalizar o thread de monitoramento a parar
monitor_stop_event = threading.Event()
parar_macro_event = threading.Event()

def att_ultima_macro(email_usuario):
    """
    Atualiza a coluna 'ultima_macro' na tabela 'tb_usuarios' para um usuário específico.

    Args:
        email_usuario (str): O email do usuário cuja última macro será atualizada.
        # Removido: nome_macro não é mais um parâmetro
    """
    db_user = 'root'
    db_password = 'SB28@sabesp'
    db_host = '10.51.109.123'  # Verifique se o IP está correto
    db_name = 'pendlist'
    connection = None
    cursor = None
    nome_macro_fixo = "Macro_Consulta_Geral" # Define o nome da macro fixo aqui

    try:
        # Use a configuração do banco para conectar com PyMySQL
        logging.info(f"Thread {threading.current_thread().name}: Tentando conectar ao banco de dados para atualizar ultima_macro.")
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name,
            cursorclass=pymysql.cursors.DictCursor # Usar DictCursor para acesso por nome
        )

        if connection:
            logging.info(f"Thread {threading.current_thread().name}: Conexão com o banco de dados bem-sucedida para atualizar ultima_macro.")

        cursor = connection.cursor()

        # --- SINTAXE SQL ---
        # Usar UPDATE ... SET ... WHERE
        # A coluna 'ultima_macro' é VARCHAR(100), atualizamos com a string fixa.
        sql = """
        UPDATE tb_usuarios
        SET ultima_macro = %s
        WHERE email = %s
        """
        # Usamos a variável nome_macro_fixo na tupla de valores
        values = (nome_macro_fixo, email_usuario)

        logging.info(f"Thread {threading.current_thread().name}: Executando SQL: {sql} com valores: {values}")
        cursor.execute(sql, values)
        connection.commit()
        logging.info(f"Thread {threading.current_thread().name}: Coluna 'ultima_macro' atualizada para '{nome_macro_fixo}' para o usuário com email '{email_usuario}'. Linhas afetadas: {cursor.rowcount}")

    except pymysql.Error as e:
        logging.error(f"Thread {threading.current_thread().name}: Erro do banco de dados (PyMySQL) ao atualizar ultima_macro: {e}")
        logging.exception(f"Thread {threading.current_thread().name}: Detalhes do erro do banco de dados ao atualizar ultima_macro:")
        if connection:
            connection.rollback() # Desfaz a operação em caso de erro

    except Exception as e:
        logging.error(f"Thread {threading.current_thread().name}: Ocorreu um erro inesperado na função att_ultima_macro: {e}")
        logging.exception(f"Thread {threading.current_thread().name}: Detalhes do erro inesperado na função att_ultima_macro:")

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            logging.info(f"Thread {threading.current_thread().name}: Conexão com o banco de dados fechada após att_ultima_macro.")


@eel.expose
def csparar_macro_backend():
    global macro_rodando, parar_macro_event
    print("Solicitação para parar a macro e encerrar a aplicação.")
    macro_rodando = False
    parar_macro_event.set() # This sets the event
    eel.close_window()
    sys.exit()


def adiciona_nao_encontrado_template_pde(item_value, file_lock):
    logging.info(f"Registrando item PDE não encontrado: {item_value}")
    dados = {
        "Valor Buscado": item_value,
        "Tipo Buscado": "PDE",
        "Fornecimento": "NÃO ENCONTRADO",
        "Tipo Mercado": "NÃO ENCONTRADO",
        "Status Fornecimento": "NÃO ENCONTRADO",
        "Titular": "NÃO ENCONTRADO",
        "Tipo Sujeito": "NÃO ENCONTRADO",
        "Endereço Fornecimento": "NÃO ENCONTRADO",
        "Tipo Fornecimento": "NÃO ENCONTRADO",
        "Oferta/Produto": "NÃO ENCONTRADO",
        "Endereço Entr Fatura": "NÃO ENCONTRADO",
        "Mod Envio Fatura": "NÃO ENCONTRADO",
        "Fatura em Braille": "NÃO ENCONTRADO",
        "Grupo Fat": "NÃO ENCONTRADO",
        "Data Próxima Leitura": "NÃO ENCONTRADO",
        "Num Economias": "NÃO ENCONTRADO",
    }

    arquivo = 'Erros_template.csv'
    df = pd.DataFrame([dados])

    with file_lock:
        try:
            if os.path.exists(arquivo):
                df.to_csv(arquivo, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
            else:
                df.to_csv(arquivo, index=False, encoding="UTF-8-SIG", sep=";")
            logging.info(f"Item {item_value} adicionado a {arquivo}")
        except Exception as e:
            logging.error(f"Erro ao adicionar item {item_value} ao arquivo de erros {arquivo}: {e}")
            logging.exception("Detalhes do erro ao adicionar ao arquivo de erros:")

def adiciona_nao_encontrado_template_hidro(item_value, file_lock):
    logging.info(f"Registrando item HIDRO não encontrado: {item_value}")
    dados = {
        "Valor Buscado": item_value,
        "Tipo Buscado": "HIDRO",
        "Fornecimento": "NÃO ENCONTRADO",
        "Pde": "NÃO ENCONTRADO",
        "Tipo mercado": "NÃO ENCONTRADO",
        "Status Fornecimento": "NÃO ENCONTRADO",
        "Titular": "NÃO ENCONTRADO",
        "Tipo Sujeito": "NÃO ENCONTRADO",
        "Endereço Fornecimento": "NÃO ENCONTRADO",
        "Tipo Fornecimento": "NÃO ENCONTRADO",
        "Oferta/Produto": "NÃO ENCONTRADO",
        "Endereço Entr Fatura": "NÃO ENCONTRADO",
        "Condição de Pgt": "NÃO ENCONTRADO",
        "Mod Envio Fatura": "NÃO ENCONTRADO",
        "Fatura em Braille": "NÃO ENCONTRADO",
        "Grupo Fat": "NÃO ENCONTRADO",
        "Data Próxima Leitura": "NÃO ENCONTRADO",
        "Num Economias": "NÃO ENCONTRADO",
    }

    arquivo = 'Erros_template.csv'
    df = pd.DataFrame([dados])

    with file_lock:
        try:
            if os.path.exists(arquivo):
                df.to_csv(arquivo, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
            else:
                df.to_csv(arquivo, index=False, encoding="UTF-8-SIG", sep=";")
            logging.info(f"Item {item_value} adicionado a {arquivo}")
        except Exception as e:
            logging.error(f"Erro ao adicionar item {item_value} ao arquivo de erros {arquivo}: {e}")
            logging.exception("Detalhes do erro ao adicionar ao arquivo de erros HIDRO:")


def armazena_final(dados, file_lock):
    logging.info(f"Armazenando dados finais para o item: {dados.get('Valor Buscado', 'N/A')}")
    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Macro Consulta Geral')

    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_file_name = f'Resultado_ConsultaGeral_{data_formatada}.csv'

    output_file_path = os.path.join(output_dir, output_file_name)

    try:
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Diretório de saída verificado/criado: {output_dir}")
    except Exception as e:
        logging.error(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")
        logging.exception("Detalhes do erro ao criar diretório de saída:")
        return

    df = pd.DataFrame([dados])

    with file_lock:
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
            logging.exception("Detalhes do erro ao salvar arquivo CSV:")


def login(thread_id, login_usuario, senha_usuario):
    options = Options()
    options.page_load_strategy = 'normal'
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-extensions")
    # options.add_argument("--headless") # Deixa o navegador invisivel
    # options.add_argument("--disable-gpu") # Deixa o navegador invisivel
    options.add_argument("--guest")
    options.add_experimental_option("prefs", {
        'download.prompt_for_download': False,
        'download.directory_upgrade': True,
        'safeBrowse.enabled': True,
        "profile.default_content_setting_values.notifications": 2
    })

    driver = None
    try:
        logging.info(f"Thread {threading.current_thread().name} - Inicializando driver...")
        driver = webdriver.ChromiumEdge(options=options)
        logging.info(f"Thread {threading.current_thread().name} - Driver inicializado.")

        url_login = "https://conecta.sabesp.com.br/NETAinf/login.aspx"
        url_destino_pos_login = 'https://conecta.sabesp.com.br/NETASIU/SIUWeb/SiuWeb.Crm/Forms/DashBoards/RicercaCliente.aspx'

        logging.info(f"Thread {threading.current_thread().name} - Navegando para {url_login}...")
        driver.get(url_login)
        logging.info(f"Thread {threading.current_thread().name} - Página de login carregada.")

        driver.maximize_window()

        wait = WebDriverWait(driver, 30)

        logging.info(f"Thread {threading.current_thread().name} - Esperando pelos campos de login (USER/PASSWORD/LOGIN)...")
        username_field = wait.until(
            EC.presence_of_element_located((By.ID, "extended_login_Username"))
        )
        password_field = wait.until(
            EC.presence_of_element_located((By.ID, "extended_login_Password"))
        )
        login_button = wait.until(
            EC.element_to_be_clickable((By.ID, "extended_login_Login"))
        )
        logging.info(f"Thread {threading.current_thread().name} - Campos de login encontrados.")

        logging.info(f"Thread {threading.current_thread().name} - Preenchendo login e senha...")
        username_field.send_keys(login_usuario)
        password_field.send_keys(senha_usuario)
        logging.info(f"Thread {threading.current_thread().name} - Clicando no botão de login...")
        login_button.click()
        logging.info(f"Thread {threading.current_thread().name} - Botão de login clicado. Aguardando página pós-login...")

        logging.info(f"Thread {threading.current_thread().name} - Navegando diretamente para a página de busca: {url_destino_pos_login}")
        driver.get(url_destino_pos_login)

        try:
             logging.info(f"Thread {threading.current_thread().name} - Esperando por elemento chave na página de busca (após navegação direta)...")
             wait.until(
                  EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr[1]/td[3]/div/fieldset/input[4]"))
             )
             logging.info(f"Thread {threading.current_thread().name} - Elemento chave na página de busca encontrado.")

        except TimeoutException:
             logging.error(f"Thread {threading.current_thread().name} - Timeout ({wait._timeout}s) esperando pelo elemento chave na página de busca APÓS navegação direta.")
             logging.error(f"Thread {threading.current_thread().name} - URL atual no momento do timeout: {driver.current_url}")
             if driver:
                 logging.info(f"Thread {threading.current_thread().name} - Fechando driver devido a timeout no login/navegação direta.")
                 driver.quit()
             return None

        logging.info(f"Thread {threading.current_thread().name} - Login realizado com sucesso e página de busca pronta.")
        return driver

    except Exception as e:
        logging.error(f"Thread {threading.current_thread().name} - Erro crítico durante o login: {str(e)}")
        logging.exception("Detalhes do erro crítico durante o login:")
        if driver:
            logging.info(f"Thread {threading.current_thread().name} - Fechando driver devido a erro no login.")
            driver.quit()
        return None

def formatar_tempo(segundos):
    """Formata segundos em uma string H:MM:SS."""
    horas = int(segundos // 3600)
    minutos = int((segundos % 3600) // 60)
    seg = int(segundos % 60)
    return f"{horas:02d}:{minutos:02d}:{seg:02d}"


def calcular_tempo_restante(total_processados, total_a_processar, lista_tempos):
    """Calcula o tempo restante estimado."""
    total_completos = total_processados + erros # Itens processados com sucesso ou com erro
    if total_completos > 0 and total_a_processar > total_completos:
        with lock_tempos:
            if lista_tempos:
                media_tempo = sum(lista_tempos) / len(lista_tempos)
                restantes = total_a_processar - total_completos
                tempo_restante_segundos = restantes * media_tempo
                return formatar_tempo(tempo_restante_segundos)
    return "Calculando..."


def monitor_progresso():
    logging.info("Iniciando monitoramento do progresso...")

    while not monitor_stop_event.is_set():
        with counter_lock:
            proc = processados
            err = erros
            total = total_processar

        completos = proc + err
        restantes = total - completos
        porcentagem = (completos / total) * 100 if total > 0 else 0

        # Calcular tempo estimado
        tempo_estimado_str = calcular_tempo_restante(proc, total, tempos_processamento)

        try:
            # Adapta a chamada Eel para enviar a contagem de erros e o tempo estimado
            # Você precisará ajustar a função eel.atualizar_status_os no frontend para receber e usar esses novos parâmetros.
            # A ordem sugerida é: item_atual, total_itens, erros_count, porcentagem, status_mensagem, tempo_estimado_str
            # O primeiro parâmetro (id_os) pode ser None ou um placeholder se não for usado pelo frontend para esta atualização geral.
            eel.atualizar_status_os(None, proc, total, err, int(porcentagem), "Processando...", tempo_estimado_str)
            # Exemplo de como o frontend pode receber: eel.expose(def atualizar_status_os(id_os, processados, total, erros, porcentagem, status_msg, tempo_estimado): ...)
        except Exception as e:
            logging.debug(f"Erro ao enviar progresso para o frontend via Eel: {e}")

        monitor_stop_event.wait(1)

    # Envia o status final e tempo estimado quando o monitor termina
    with counter_lock:
        proc = processados
        err = erros
        total = total_processar
    completos = proc + err
    restantes = total - completos

    # Calcula o tempo estimado final (deve ser 0:00:00 se tudo terminou)
    tempo_estimado_str_final = calcular_tempo_restante(proc, total, tempos_processamento)

    try:
         # Envia a atualização final (porcentagem 100, status concluído)
         eel.atualizar_status_os(None, proc, total, err, 100, "Concluído", tempo_estimado_str_final)
    except Exception as e:
         logging.debug(f"Erro ao enviar status final via Eel: {e}")


    logging.info(f"Monitoramento finalizado. Processados: {proc}/{total} | Erros: {err} | Restantes: {restantes}")


# --- CORREÇÃO AQUI: Adicionado email_usuario como parâmetro ---
def macro(driver, item_value, item_type, file_lock, counter_lock, email_usuario):
    global processados, erros, tempos_processamento # Adiciona tempos_processamento aqui

    logging.info(f"Thread {threading.current_thread().name} - Iniciando processamento para {item_type} {str(item_value).strip()}")

    wait = WebDriverWait(driver, 10)
    processed_successfully = False
    start_time = time.time() # Registra o tempo de início do processamento do item

    try:
        # --- VERIFICAÇÃO DE PARADA ---
        if parar_macro_event.is_set():
            logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado antes de atualizar a página. Encerrando macro para {str(item_value).strip()}.")
            return # Sai da função macro imediatamente
        # --------------------------
        logging.info(f"Thread {threading.current_thread().name} - Atualizando página para item {str(item_value).strip()}")
        driver.refresh()

        current_url = driver.current_url
        if 'RicercaCliente.aspx' not in current_url:
             logging.warning(f"Thread {threading.current_thread().name} - Não estava na página de busca ({current_url}), navegando de volta.")
             driver.get('https://conecta.sabesp.com.br/NETASIU/SIUWeb/SiuWeb.Crm/Forms/DashBoards/RicercaCliente.aspx')
             # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
             try:
                 wait_nav = WebDriverWait(driver, 30) # Aumentado timeout para dar tempo de carregar
                 wait_nav.until(EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr[1]/td[3]/div/fieldset/input[4]")))
                 logging.info(f"Thread {threading.current_thread().name} - Navegou de volta para a página de busca.")
             except TimeoutException:
                 logging.error(f"Thread {threading.current_thread().name} - Timeout esperando elemento chave após navegar de volta. Não foi possível retornar à página de busca.")
                 # Tratar como erro ou falha no item, dependendo da lógica desejada
                 processed_successfully = False
                 return # Sai da função macro se não conseguir voltar
             # ----------------------------------------

        processed_value = str(item_value).strip()

        input_field_xpath = "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[4]" if item_type.upper() == "PDE" else '/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[3]'
        button_xpath = "/html/body/form/div[4]/div[4]/table/tbody/tr[2]/td/input[3]" if item_type.upper() == "PDE" else '/html/body/form/div[4]/div[4]/table/tbody/tr[2]/td/input[5]'

        # --- VERIFICAÇÃO DE PARADA ---
        if parar_macro_event.is_set():
            logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado antes de buscar campos. Encerrando macro para {str(item_value).strip()}.")
            return # Sai da função macro imediatamente
        # --------------------------
        logging.info(f"Thread {threading.current_thread().name} - Buscando campo de input para {item_type} com XPATH: {input_field_xpath}")
        input_field = wait.until(
            EC.presence_of_element_located((By.XPATH, input_field_xpath))
        )

        input_field.clear()
        logging.info(f"Thread {threading.current_thread().name} - Enviando valor '{processed_value}' para o campo de busca de {item_type}.")
        input_field.send_keys(processed_value)

        # --- VERIFICAÇÃO DE PARADA ---
        if parar_macro_event.is_set():
            logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado antes de buscar botão. Encerrando macro para {str(item_value).strip()}.")
            return # Sai da função macro imediatamente
        # --------------------------
        logging.info(f"Thread {threading.current_thread().name} - Buscando botão de busca para {item_type} com XPATH: {button_xpath}")
        button = wait.until(
            EC.element_to_be_clickable((By.XPATH, button_xpath))
        )
        logging.info(f"Thread {threading.current_thread().name} - Clicando no botão de busca para {item_type}.")
        button.click()

        wait_search_results = WebDriverWait(driver, 10)

        if item_type.upper() == "PDE":
            try:
                 iframe_xpath_initial = '//*[@id="ifCruscottoPdr"]'
                 logging.info(f"Thread {threading.current_thread().name} - Esperando iframe inicial ({iframe_xpath_initial}) para PDE.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 iframe = wait_search_results.until(
                     EC.presence_of_element_located((By.XPATH, iframe_xpath_initial))
                 )
                 # ----------------------------------------
                 driver.switch_to.frame(iframe)
                 logging.info(f"Thread {threading.current_thread().name} - Entrou no iframe {iframe_xpath_initial} para PDE.")

                 painel_element_xpath = '//*[@id="ctl00_NetSiuCPH_btni_crm_crupdr_apricruf"]'
                 logging.info(f"Thread {threading.current_thread().name} - Esperando elemento Painel Fornecimento ({painel_element_xpath}) para PDE.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 painel_element = wait.until(
                     EC.presence_of_element_located((By.XPATH, painel_element_xpath))
                 )
                 # ----------------------------------------
                 logging.info(f"Thread {threading.current_thread().name} - Clicando em Painel Fornecimento para PDE.")
                 painel_element.click()

                 driver.switch_to.default_content()
                 logging.info(f"Thread {threading.current_thread().name} - Voltou para o conteúdo padrão.")

                 iframe_detail_xpath = '//*[@id="ifCruscottoUtenza"]'
                 logging.info(f"Thread {threading.current_thread().name} - Esperando iframe de detalhe ({iframe_detail_xpath}) para PDE.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 iframe_detail = wait.until(
                     EC.presence_of_element_located((By.XPATH, iframe_detail_xpath))
                 )
                 # ----------------------------------------
                 driver.switch_to.frame(iframe_detail)
                 logging.info(f"Thread {threading.current_thread().name} - Entrou no iframe de detalhe {iframe_detail_xpath} para PDE.")

            except TimeoutException:
                 logging.warning(f"Thread {threading.current_thread().name} - Timeout esperando elemento chave após busca para PDE {processed_value}. Possivelmente não encontrado.")
                 adiciona_nao_encontrado_template_pde(item_value, file_lock)
                 with counter_lock:
                      erros += 1
                 processed_successfully = False
                 return

        elif item_type.upper() == "HIDRO":
            try:
                 painel_cliente_xpath = '/html/body/form/div[4]/div[4]/table/tbody/tr[3]/td/div/div/table/tbody/tr[2]/td[10]/div/div/input[4]'
                 logging.info(f"Thread {threading.current_thread().name} - Tentando encontrar e clicar em Painel Cliente ({painel_cliente_xpath}) para HIDRO.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 painel_cliente = wait_search_results.until(EC.presence_of_element_located((By.XPATH, painel_cliente_xpath)))
                 # ----------------------------------------
                 logging.info(f"Thread {threading.current_thread().name} - Clicando em Painel Cliente para HIDRO.")
                 painel_cliente.click()

                 iframe_modal_xpath = '//*[@id="NETAModalDialogiFrame_1"]'
                 logging.info(f"Thread {threading.current_thread().name} - Esperando iframe do modal ({iframe_modal_xpath}) para HIDRO.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 iframe = wait.until(EC.presence_of_element_located((By.XPATH, iframe_modal_xpath)))
                 # ----------------------------------------
                 driver.switch_to.frame(iframe)
                 logging.info(f"Thread {threading.current_thread().name} - Entrou no iframe do modal {iframe_modal_xpath} para HIDRO.")

                 painel_fornecimento_xpath_inside_iframe = '/html/body/form/div[5]/div[1]/div/fieldset/div[3]/div/table/tbody/tr[2]/td[13]/div/div/input[1]'
                 logging.info(f"Thread {threading.current_thread().name} - Esperando Painel Fornecimento dentro do modal ({painel_fornecimento_xpath_inside_iframe}) para HIDRO.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 painel_fornecimento = wait.until(EC.presence_of_element_located((By.XPATH, painel_fornecimento_xpath_inside_iframe)))
                 # ----------------------------------------
                 logging.info(f"Thread {threading.current_thread().name} - Clicando em Painel Fornecimento dentro do modal.")
                 painel_fornecimento.click()

                 driver.switch_to.default_content()
                 logging.info(f"Thread {threading.current_thread().name} - Voltou para o conteúdo padrão após modal HIDRO.")

                 iframe_fornecimento_xpath = '//*[@id="ifCruscottoUtenza"]'
                 logging.info(f"Thread {threading.current_thread().name} - Esperando iframe de detalhe ({iframe_fornecimento_xpath}) para HIDRO.")
                 # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                 iframe_fornecimento = wait.until(EC.presence_of_element_located((By.XPATH, iframe_fornecimento_xpath)))
                 # ----------------------------------------
                 driver.switch_to.frame(iframe_fornecimento)
                 logging.info(f"Thread {threading.current_thread().name} - Entrou no iframe de detalhe {iframe_fornecimento_xpath} para HIDRO.")

            except TimeoutException:
                 logging.warning(f"Thread {threading.current_thread().name} - Timeout esperando elemento (Painel Cliente ou Painel Fornecimento) após busca para HIDRO {processed_value}. Possivelmente não encontrado.")
                 adiciona_nao_encontrado_template_hidro(item_value, file_lock)
                 with counter_lock:
                     erros += 1
                 processed_successfully = False
                 return
            except Exception as e:
                 logging.error(f"Thread {threading.current_thread().name} - Erro durante sequência de cliques (Painel Cliente/Fornecimento) para HIDRO {processed_value}: {e}")
                 logging.exception("Detalhes do erro na sequência de cliques HIDRO:")
                 adiciona_nao_encontrado_template_hidro(item_value, file_lock)
                 with counter_lock:
                     erros += 1
                 processed_successfully = False
                 return


        try:
            # --- VERIFICAÇÃO DE PARADA ---
            if parar_macro_event.is_set():
                logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado antes de extrair dados. Encerrando macro para {str(item_value).strip()}.")
                return # Sai da função macro imediatamente
            # --------------------------
            logging.info(f"Thread {threading.current_thread().name} - Iniciando extração de dados para {processed_value}.")
            # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
            dados_fornecimento_element = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]')))
            # ----------------------------------------
            textos_painel_fornecimento = dados_fornecimento_element.find_elements(By.XPATH, ".//span[not(contains(@style, 'display:none')) and not(contains(@style, 'visibility:hidden'))]")
            text_ok_fornecimento = [element.text for element in textos_painel_fornecimento if element.text.strip() != '']

            dados = {}
            default_keys = ["Fornecimento", "Pde", "Hidrômetro", "Tipo mercado", "Status Fornecimento", "Titular", "Tipo sujeito", "Endereço Fornecimento", "Tipo Fornecimento", "Oferta/Produto", "Endereço Entr Fatura", "Condição de Pgt", "Mod Envio Fatura", "Fatura em Braille", "Grupo Fat", "Data Próxima Leitura", "Num Economias"]
            for key in default_keys:
                dados[key] = "NÃO ENCONTRADO"

            dados["Valor Buscado"] = item_value

            for i, palavra in enumerate(text_ok_fornecimento):
                 # --- VERIFICAÇÃO DE PARADA DENTRO DO LOOP DE EXTRAÇÃO (se for muito longo) ---
                 if parar_macro_event.is_set():
                     logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado durante extração. Encerrando macro para {str(item_value).strip()}.")
                     return # Sai da função macro imediatamente
                 # -------------------------------------------------------------------------
                 if palavra == "Código :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Fornecimento"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Pde :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Pde"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Hidrômetro :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Hidrômetro"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Tipo mercado :":
                     if i + 1 < len(text_ok_fornecimento):
                           dados["Tipo mercado"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Status Fornecimento :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Status Fornecimento"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Titular :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Titular"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Tipo sujeito :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Tipo sujeito"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Endereço Fornecimento :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Endereço Fornecimento"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Tipo Fornecimento :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Tipo Fornecimento"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Oferta/Produto :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Oferta/Produto"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Endereço Entr Fatura :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Endereço Entr Fatura"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Condição de Pgt :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Condição de Pgt"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Mod Envio Fatura :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Mod Envio Fatura"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Fatura em Braille :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Fatura em Braille"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Grupo Fat :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Grupo Fat"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Data Próxima Leitura :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Data Próxima Leitura"] = text_ok_fornecimento[i + 1]
                 elif palavra == "Num. Economias :":
                      if i + 1 < len(text_ok_fornecimento):
                           dados["Num Economias"] = text_ok_fornecimento[i + 1]


            logging.info(f"Thread {threading.current_thread().name} - Dados extraídos com sucesso para {item_type} {processed_value}")

            driver.switch_to.default_content()
            logging.info(f"Thread {threading.current_thread().name} - Voltou para o conteúdo padrão após extração.")


            if item_type.upper() == "HIDRO":
                 try:
                      botao_fechar_modal_principal_xpath = '//*[@id="ctl00_NetSiuCPH_TabCRM_bli_tcrm_cruscotti"]/li/a/span/input'
                      logging.info(f"Thread {threading.current_thread().name} - Tentando fechar modal principal para HIDRO com XPATH: {botao_fechar_modal_principal_xpath}")
                      # --- VERIFICAÇÃO DE PARADA DURANTE ESPERA ---
                      botao_fechar_modal_principal = wait.until(EC.element_to_be_clickable((By.XPATH, botao_fechar_modal_principal_xpath)))
                      # ----------------------------------------
                      botao_fechar_modal_principal.click()
                      logging.info(f"Thread {threading.current_thread().name} - Modal principal HIDRO fechado.")
                 except Exception as e:
                      logging.warning(f"Thread {threading.current_thread().name} - Erro ou Timeout ao fechar modal principal para HIDRO {processed_value}: {e}")

            # --- VERIFICAÇÃO DE PARADA ---
            if parar_macro_event.is_set():
                logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado antes de armazenar/atualizar DB. Encerrando macro para {str(item_value).strip()}.")
                return # Sai da função macro imediatamente
            # --------------------------
            with counter_lock:
                processados += 1
                logging.info(f"Thread {threading.current_thread().name} - Contador de processados incrementado. Total: {processados}")
            processed_successfully = True

        except Exception as e:
            logging.error(f"Thread {threading.current_thread().name} - Erro durante a extração de dados para {item_type} {processed_value}: {e}")
            logging.exception("Detalhes do erro na extração de dados:")
            processed_successfully = False


    except Exception as e:
        logging.error(f"Thread {threading.current_thread().name} - Erro durante a busca inicial/entrada iframe para {item_type} {str(item_value).strip()}: {e}")
        logging.exception("Detalhes do erro na busca inicial/entrada iframe:")
        processed_successfully = False

    finally:
         logging.info(f"Thread {threading.current_thread().name} - Bloco finally para item {str(item_value).strip()}. Processado com sucesso: {processed_successfully}")

         # Calcula e armazena o tempo de processamento para este item
         end_time = time.time()
         duration = end_time - start_time
         with lock_tempos:
              tempos_processamento.append(duration)

         if not processed_successfully:
             logging.warning(f"Thread {threading.current_thread().name} - Item {str(item_value).strip()} falhou no processamento.")


# --- CORREÇÃO AQUI: Adicionado email_usuario como oitavo parâmetro ---
def thread_task(thread_id, items_chunk, item_type, file_lock, counter_lock, login_usuario, senha_usuario, email_usuario):
    logging.info(f"Thread {threading.current_thread().name} started with {len(items_chunk)} items (Type: {item_type}).")

    driver = None
    try:
        logging.info(f"Thread {threading.current_thread().name} - Iniciando processo de login.")
        # --- VERIFICAÇÃO DE PARADA ANTES DO LOGIN ---
        if parar_macro_event.is_set():
            logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada detectado antes do login. Encerrando thread.")
            return # Sai da thread_task imediatamente
        # ----------------------------------------
        driver = login(thread_id, login_usuario, senha_usuario)

        if driver:
            logging.info(f"Thread {threading.current_thread().name} - Login bem-sucedido. Começando a processar lote de itens.")
            for item_value in items_chunk:
                # Check parar_macro_event before processing each item
                if parar_macro_event.is_set():
                    logging.warning(f"Thread {threading.current_thread().name} - Sinal de parada recebido. Encerrando processamento do lote.")
                    break # Exit the loop processing items in this chunk

                # --- Passando email_usuario para a função macro ---
                macro(driver, item_value, item_type, file_lock, counter_lock, email_usuario)

        else:
             logging.error(f"Thread {threading.current_thread().name} - Falha crítica no login. Não foi possível processar nenhum item deste lote.")
             num_itens_falhou_login = len(items_chunk)
             logging.warning(f"Thread {threading.current_thread().name} - {num_itens_falhou_login} itens não processados devido à falha no login.")
             # Opcional: Adicionar itens falhados por login ao contador de erros e arquivo de erros
             with counter_lock:
                 erros += num_itens_falhou_login
             with file_lock:
                 for item_value in items_chunk:
                     if item_type.upper() == "PDE":
                         adiciona_nao_encontrado_template_pde(item_value, file_lock)
                     elif item_type.upper() == "HIDRO":
                         adiciona_nao_encontrado_template_hidro(item_value, file_lock)


    except Exception as e:
        logging.error(f"Thread {threading.current_thread().name} encountered a critical error: {e}")
        logging.exception("Detalhes do erro crítico na thread_task:")


    finally:
        if driver:
            try:
                driver.quit()
                logging.info(f"Thread {threading.current_thread().name} terminou e saiu do driver.")
            except Exception as driver_quit_error:
                logging.error(f"Thread {threading.current_thread().name} - Erro ao fechar o driver no finally: {driver_quit_error}")
                logging.exception(f"Thread {threading.current_thread().name} - Detalhes do erro ao fechar o driver:")


def iniciar_consulta_geral_backend(conteudo_arquivo, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_macro, identificador_usuario):
    logging.info(f"[ConsultaGeral] -> Função iniciar_consulta_geral_backend recebida. Identificador: {identificador_usuario}")
    logging.info(f"[ConsultaGeral] -> Tipo de arquivo: {tipo_arquivo}, Tipo de macro: {tipo_macro}, Nome do arquivo: {nome_arquivo}")

    global total_processar, processados, erros, tempos_processamento # Adiciona tempos_processamento aqui

    total_processar = 0
    processados = 0
    erros = 0
    tempos_processamento = [] # Reseta a lista de tempos a cada nova execução
    monitor_stop_event.clear()
    parar_macro_event.clear() # Resetar o evento de parada da macro também!
    logging.info("[ConsultaGeral] -> Contadores, tempos e eventos de parada resetados.")

    num_browsers = 1
    logging.info(f"[ConsultaGeral] -> Definido número de navegadores/threads (inicial): {num_browsers}")


    try:
        logging.info(f"[ConsultaGeral] -> Tentando ler o conteúdo do arquivo '{nome_arquivo}' (Tipo: {tipo_arquivo}).")
        df_initial = pd.DataFrame()

        if tipo_arquivo == 'csv':
            try:
                 conteudo_decodificado = base64.b64decode(conteudo_arquivo).decode('utf-8')
                 logging.info("[ConsultaGeral] -> Conteúdo CSV decodificado. Tentando ler com pandas.")
                 df_initial = pd.read_csv(StringIO(conteudo_decodificado), sep=';')
                 logging.info("[ConsultaGeral] -> Arquivo CSV lido com sucesso do conteúdo.")
            except Exception as e:
                 logging.error(f"[ConsultaGeral] -> Erro ao ler arquivo CSV do conteúdo: {e}")
                 logging.exception("Detalhes do erro na leitura CSV:")
                 return {"status": "erro", "mensagem": f"Erro ao ler arquivo CSV: {str(e)}"}

        elif tipo_arquivo == 'excel':
            try:
                 conteudo_decodificado_bytes = base64.b64decode(conteudo_arquivo)
                 logging.info("[ConsultaGeral] -> Conteúdo Excel decodificado.")

                 logging.info("[ConsultaGeral] -> Procurando linha de cabeçalho contendo 'HIDRO' ou 'PDE'.")
                 df_temp = pd.read_excel(BytesIO(conteudo_decodificado_bytes), header=None)

                 found_header_index = None
                 search_rows_limit = 20

                 target_column_keywords = ['pde', 'código pde', 'numero pde', 'hidro', 'hidrometro', 'hidrômetro', 'num. hidrometro', 'número hidrometro', 'hidrometo']

                 for index, row in df_temp.head(search_rows_limit).iterrows():
                     row_values_lower = row.astype(str).str.lower().tolist()
                     if any(any(keyword in str(cell_value) for keyword in target_column_keywords) for cell_value in row_values_lower):
                         found_header_index = index
                         logging.info(f"[ConsultaGeral] -> Linha de cabeçalho encontrada no índice: {found_header_index} (Linha {found_header_index + 1} no Excel).")
                         break

                 if found_header_index is None:
                     logging.warning(f"[ConsultaGeral] -> Linha de cabeçalho não encontrada nas primeiras {search_rows_limit} linhas.")
                     logging.warning(f"[ConsultaGeral] -> Primeiras linhas lidas (sem cabeçalho): \n{df_temp.head(search_rows_limit).to_string()}")
                     return {"status": "erro", "mensagem": f"Erro: Não foi possível identificar a linha de cabeçalho contendo 'HIDRO' ou 'PDE' nas primeiras {search_rows_limit} linhas do arquivo. Verifique se o cabeçalho existe e se os termos de busca ('HIDRO', 'PDE', ou similares) estão presentes em uma única linha inicial."}


                 logging.info(f"[ConsultaGeral] -> Relendo arquivo Excel com cabeçalho na linha: {found_header_index + 1}.")
                 df_initial = pd.read_excel(BytesIO(conteudo_decodificado_bytes), header=found_header_index)
                 logging.info("[ConsultaGeral] -> Arquivo Excel relido com cabeçalho especificado.")

                 logging.info(f"[ConsultaGeral] -> Colunas encontradas após reler com header={found_header_index}: {list(df_initial.columns)}.")

            except Exception as e:
                 logging.error(f"[ConsultaGeral] -> Erro ao ler arquivo Excel ou encontrar cabeçalho: {e}")
                 logging.exception("Detalhes do erro na leitura Excel ou busca de cabeçalho:")
                 return {"status": "erro", "mensagem": f"Erro ao ler arquivo Excel ou encontrar cabeçalho: {str(e)}"}
        else:
            logging.error(f"[ConsultaGeral] -> Tipo de arquivo '{tipo_arquivo}' não suportado.")
            return {"status": "erro", "mensagem": f"Tipo de arquivo '{tipo_arquivo}' não suportado."}


        if df_initial.empty:
            logging.warning("[ConsultaGeral] -> Arquivo de entrada está vazio ou ficou vazio após definir o cabeçalho. Nada para processar.")
            return {"status": "sucesso", "mensagem": "Arquivo de entrada está vazio. Nada para processar."}

        logging.info(f"[ConsultaGeral] -> Tentando encontrar a coluna para o tipo de macro: {tipo_macro}")

        target_column_name = None

        possible_column_names = {}
        if tipo_macro.upper() == "PDE":
            possible_column_names = ['pde', 'código pde', 'numero pde']
        elif tipo_macro.upper() == "HIDRO":
            possible_column_names = ['hidro', 'hidrometro', 'hidrômetro', 'num. hidrometro', 'número hidrometro', 'hidrometo']
        else:
             logging.error(f"[ConsultaGeral] -> Tipo de macro '{tipo_macro}' inválido recebido do frontend.")
             return {"status": "erro", "mensagem": f"Erro interno: Tipo de macro '{tipo_macro}' inválido."}


        df_initial.columns = df_initial.columns.astype(str).str.lower()

        for col in df_initial.columns:
            if any(name in col for name in possible_column_names):
                target_column_name = col
                break

        if target_column_name is None:
            logging.warning(f"[ConsultaGeral] -> Coluna para o tipo de macro '{tipo_macro}' não encontrada no arquivo.")
            logging.warning(f"[ConsultaGeral] -> Colunas encontradas no arquivo após definir o cabeçalho: {list(df_initial.columns)}.")
            return {"status": "erro", "mensagem": f"Erro: Não foi encontrada uma coluna com nome relacionado a '{tipo_macro}' no arquivo. Colunas encontradas após definir o cabeçalho: {list(df_initial.columns)}. Verifique se a coluna existe e se o cabeçalho está correto."}

        logging.info(f"[ConsultaGeral] -> Coluna '{target_column_name}' encontrada para o tipo de macro '{tipo_macro}'.")


        all_items = df_initial[target_column_name].dropna().tolist()
        total_processar = len(all_items)
        logging.info(f"[ConsultaGeral] -> Total de valores para processar: {total_processar} da coluna '{target_column_name}'.")

        if total_processar == 0:
             logging.warning(f"[ConsultaGeral] -> Nenhum item válido encontrado para processar na coluna '{target_column_name}' após remover valores vazios.")
             return {"status": "sucesso", "mensagem": f"Nenhum item válido encontrado para processar na coluna '{target_column_name}'."}


        logging.info(f"[ConsultaGeral] -> Ajustando número de navegadores/threads. Inicial: {num_browsers}, Total itens: {total_processar}")
        if num_browsers > total_processar:
            num_browsers = total_processar
            logging.warning(f"[ConsultaGeral] -> Número de navegadores ajustado para {num_browsers} (igual ao total de itens).")
        elif num_browsers <= 0:
             num_browsers = 1
             logging.warning(f"[ConsultaGeral] -> Número de navegadores inválido ou zero, ajustado para {num_browsers}.")

        logging.info(f"[ConsultaGeral] -> Número final de navegadores/threads: {num_browsers}")


        item_chunks = np.array_split(all_items, num_browsers)
        logging.info(f"[ConsultaGeral] -> Itens divididos em {len(item_chunks)} chunks para {num_browsers} threads.")

        tempo_inicial = datetime.now()
        logging.info("[ConsultaGeral] -> Começo da operação: %s", tempo_inicial.strftime("%H:%M -- %d/%m"))

        try:
            # CORREÇÃO: Passando o email correto 'adm' para o usuário 'Administrador'
            if identificador_usuario == 'Administrador':
                 att_ultima_macro('adm')
                 logging.info(f"[ConsultaGeral] -> Coluna 'ultima_macro' atualizada para o usuário: adm (baseado no identificador '{identificador_usuario}')")
            else:
                 # Para outros usuários, continua usando o identificador recebido (se for o email)
                 att_ultima_macro(identificador_usuario)
                 logging.info(f"[ConsultaGeral] -> Coluna 'ultima_macro' atualizada para o usuário: {identificador_usuario}")

        except Exception as db_error:
            logging.error(f"[ConsultaGeral] -> Erro ao chamar att_ultima_macro para o usuário {identificador_usuario}: {db_error}")
            logging.exception("[ConsultaGeral] -> Detalhes do erro ao chamar att_ultima_macro:")
        # --------------------------------------------------------------------


        threads = []
        logging.info("[ConsultaGeral] -> Iniciando criação e execução das threads de processamento.")
        for i in range(num_browsers):
            chunk = item_chunks[i].tolist()
            if chunk:
                logging.info(f"[ConsultaGeral] -> Criando Thread {i+1} com {len(chunk)} itens.")
                thread = threading.Thread(target=thread_task,
                                          # --- Passando identificador_usuario (email) para thread_task ---
                                          args=(i, chunk, tipo_macro, file_lock, counter_lock, login_usuario, senha_usuario, identificador_usuario),
                                          name=f"Browser-{i+1}")
                threads.append(thread)
                thread.start()
                logging.info(f"Thread {i+1} iniciada.")
            else:
                 logging.warning(f"[ConsultaGeral] -> Chunk {i} está vazio, pulando criação de thread para este chunk.")


        logging.info("[ConsultaGeral] -> Iniciando thread de monitoramento.")
        monitor_thread = threading.Thread(target=monitor_progresso, name="Monitor")
        monitor_thread.start()

        logging.info("[ConsultaGeral] -> Esperando threads de processamento terminarem.")
        for thread in threads:
            thread.join()
        logging.info("[ConsultaGeral] -> Threads de processamento finalizadas.")

        logging.info("[ConsultaGeral] -> Sinalizando thread de monitoramento para parar.")
        monitor_stop_event.set()
        monitor_thread.join(timeout=5)
        if monitor_thread.is_alive():
            logging.warning("[ConsultaGeral] -> Thread de monitoramento ainda ativa após join com timeout.")
        else:
             logging.info("[ConsultaGeral] -> Thread de monitoramento finalizada.")


        tempo_final = datetime.now()
        tempo_total = tempo_final - tempo_inicial
        total_segundos = int(tempo_total.total_seconds())

        tempo_str = ""
        if total_segundos < 60: tempo_str = f"{total_segundos} segundos"
        else:
            total_minutos = total_segundos // 60
            total_segundos_restantes = total_segundos % 60
            if total_minutos < 60: tempo_str = f"{total_minutos} minutos e {total_segundos_restantes} segundos"
            else:
                total_horas = total_minutos // 60
                total_minutos_restantes = total_minutos % 60
                tempo_str = f"{total_horas} horas e {total_minutos_restantes} minutos"

        logging.info("[ConsultaGeral] -> Termino da operação: %s", tempo_final.strftime('%H:%M -- %d/%m'))
        with counter_lock:
            logging.info(f"[ConsultaGeral] -> Total de itens processados: {processados}")
            logging.info(f"[ConsultaGeral] -> Total de erros: {erros}")
            logging.info(f"[ConsultaGeral] -> Total inicial: {total_processar}")
        logging.info(f"[ConsultaGeral] -> Tempo total: {tempo_str}")


        return {
            "status": "sucesso",
            "mensagem": "Processamento concluído.",
            "resumo": {
                "processados": processados,
                "erros": erros,
                "total_inicial": total_processar,
                "tempo_total": tempo_str,
                "hora_inicio": tempo_inicial.strftime("%H:%M"),
                "data_inicio": tempo_inicial.strftime("%d/%m"),
                "hora_termino": tempo_final.strftime("%H:%M"),
                "data_termino": tempo_final.strftime("%d/%m")
            }
        }

    except Exception as e:
        logging.error(f"[ConsultaGeral] -> Ocorreu um erro inesperado durante a Consulta Geral: {e}")
        logging.exception("Detalhes do erro inesperado durante a Consulta Geral:")

        monitor_stop_event.set()

        try:
            if 'monitor_thread' in locals() and monitor_thread.is_alive():
               monitor_thread.join(timeout=2)
        except Exception as monitor_join_error:
             logging.error(f"[ConsultaGeral] -> Erro ao tentar join no monitor_thread no except principal: {monitor_join_error}")


        return {"status": "erro", "mensagem": f"Ocorreu um erro interno durante a execução: {str(e)}"}

