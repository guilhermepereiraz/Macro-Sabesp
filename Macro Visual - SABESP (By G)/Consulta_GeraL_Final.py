import eel
import traceback
import os
import glob
import pandas as pd
import pymysql
import ctypes
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException
import threading
import time
import sys
from datetime import datetime
import queue
import subprocess

# Defina constantes globais necessárias
MAX_RELOGIN_ATTEMPTS = 3

def get_desktop_path():
    try:
        CSIDL_DESKTOP = 0
        SHGFP_TYPE_CURRENT = 0
        buf = ctypes.create_unicode_buffer(260)
        ctypes.windll.shell32.SHGetFolderPathW(None, CSIDL_DESKTOP, None, SHGFP_TYPE_CURRENT, buf)
        return buf.value
    except Exception:
        return os.path.join(os.path.expanduser('~'), 'Desktop')


# Definição da exceção personalizada - mantida no início do arquivo
class ItemProcessingError(Exception):
    """Exceção para erros no processamento de itens na macro."""
    pass

# Variáveis globais para contagem
total_processar = 0
processados = 0
erros = 0

# Locks para acesso thread-safe a recursos compartilhados
file_lock = threading.Lock()
counter_lock = threading.Lock()

# Evento para sinalizar o thread de monitoramento a parar
monitor_stop_event = threading.Event()

current_os_being_processed = "Calculando..."
current_os_lock = threading.Lock()
tempo_inicial_global = None

total_segundos_decorridos = 0.0
tempo_por_item_medio = 0.0

time_calculation_lock = threading.Lock()

pause_event = threading.Event()
stop_event = threading.Event()  # Novo evento para controlar o encerramento total

# Variáveis globais para gerenciar drivers ativos
active_drivers = []
driver_lock = threading.Lock()

@eel.expose
def encerrar_threads():
    """
    Função para encerrar imediatamente a macro e todas as threads.
    """
    try:
        print("\n=== INÍCIO DO ENCERRAMENTO DE THREADS ===")
        print("Iniciando encerramento forçado da macro...")
        
        # Encerra os navegadores ativos
        with driver_lock:
            total_drivers = len(active_drivers)
            print(f"Total de drivers ativos encontrados: {total_drivers}")
            
            for i, driver in enumerate(active_drivers, 1):
                try:
                    print(f"Tentando encerrar driver {i} de {total_drivers}...")
                    driver.quit()
                    print(f"Driver {i} encerrado com sucesso")
                except Exception as e:
                    print(f"Erro ao encerrar driver {i}: {str(e)}")
                    print(f"Detalhes do erro: {traceback.format_exc()}")
            
            active_drivers.clear()
            print("Lista de drivers ativos limpa")
        
        print("Todos os navegadores foram processados")
        print("Preparando para encerrar processo Python...")
        
        # Força o encerramento do processo Python
        import sys
        print("=== FIM DO ENCERRAMENTO DE THREADS ===\n")
        sys.exit(0)
        
    except Exception as e:
        error_msg = f"Erro crítico ao encerrar threads: {str(e)}"
        print(error_msg)
        print(f"Traceback completo: {traceback.format_exc()}")
        return {"status": "erro", "message": error_msg}

@eel.expose
def open_results_folder():
    """
    Abre a pasta de resultados da Macro Consulta Geral no explorador de arquivos.
    A pasta é Desktop/Macro JGL/Macro Consulta Geral.
    """
    try:
        # Usa função robusta para obter Desktop
        try:
            desktop_path = get_desktop_path()
        except Exception as e:
            print(f"[open_results_folder] Erro ao obter Desktop: {e}")
            desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop')

        results_path = os.path.join(desktop_path, 'Macro JGL', 'Macro Consulta Geral')
        print(f"[open_results_folder] Tentando abrir: {results_path}")

        if not os.path.exists(results_path):
            os.makedirs(results_path, exist_ok=True)
            print(f"[open_results_folder] Pasta criada: {results_path}")

        if sys.platform == "win32" or os.name == 'nt':
            try:
                print(f"[open_results_folder] Tentando abrir com os.startfile...")
                os.startfile(results_path)
                print(f"[open_results_folder] os.startfile executado com sucesso.")
                return {"status": "success", "message": f"Pasta '{results_path}' aberta com sucesso (startfile)."}
            except Exception as e:
                print(f"[open_results_folder] Erro ao executar os.startfile: {e}")
                # Fallback para subprocess
                try:
                    print(f"[open_results_folder] Tentando abrir com subprocess explorer...")
                    subprocess.Popen(['explorer', results_path])
                    print(f"[open_results_folder] subprocess explorer executado com sucesso.")
                    return {"status": "success", "message": f"Pasta '{results_path}' aberta com sucesso (explorer)."}
                except Exception as e2:
                    print(f"[open_results_folder] Fallback explorer também falhou: {e2}")
                    return {"status": "error", "message": f"Erro ao abrir a pasta: {e} | Fallback: {e2} | Caminho: {results_path}"}
        elif sys.platform == "darwin":
            subprocess.run(['open', results_path], check=True)
            return {"status": "success", "message": f"Pasta '{results_path}' aberta com sucesso (macOS)."},
        else:
            subprocess.run(['xdg-open', results_path], check=True)
            return {"status": "success", "message": f"Pasta '{results_path}' aberta com sucesso (Linux)."}

    except Exception as e:
        error_message = f"Erro ao abrir a pasta de resultados: {e} | Caminho: {results_path}"
        print(error_message)
        return {"status": "error", "message": error_message}

def formatar_tempo_legivel(segundos):
    if segundos is None:
        return "Calculando..."
    segundos = int(segundos)
    if segundos < 0:
        return "Calculando..."
    
    horas = segundos // 3600
    minutos = (segundos % 3600) // 60
    segundos_restantes = segundos % 60

    partes = []
    if horas > 0:
        partes.append(f"{horas}h")
    if minutos > 0 or (horas > 0 and segundos_restantes > 0):
        partes.append(f"{minutos}m")
    if segundos_restantes > 0 or (not partes and segundos == 0):
        partes.append(f"{segundos_restantes}s")
    
    if not partes:
        return "0s"
    
    return " ".join(partes)

def invisibility_or_absence(locator):
    def _predicate(driver):
        try:
            element = driver.find_element(*locator)
            return not element.is_displayed()
        except (NoSuchElementException, StaleElementReferenceException):
            return True  # Considera invisível se não existe mais
    return _predicate

def filtrar_itens_nao_processados(lista_os, nome_arquivo_resultado=None, nome_arquivo_erros=None):
    """
    Remove da lista_os todos os itens que já estão no arquivo de resultados ou de erros.
    """
    import os
    import glob
    import pandas as pd

    processados = set()
    erros = set()

    # Busca o arquivo de resultados mais recente, se não for passado
    if not nome_arquivo_resultado:
        arquivos_resultado = glob.glob(os.path.join(
            os.path.expanduser('~'), 'Desktop', 'Macro JGL', 'Macro Consulta Geral', 'Resultado_Consulta_Geral-*.csv'))
        if arquivos_resultado:
            nome_arquivo_resultado = max(arquivos_resultado, key=os.path.getctime)
    if nome_arquivo_resultado and os.path.exists(nome_arquivo_resultado):
        try:
            df_result = pd.read_csv(nome_arquivo_resultado, sep=';', encoding='utf-8-sig')
            col_result = None
            for col in ['PDE', 'HIDRO', 'Hidrometro']:
                if col in df_result.columns:
                    col_result = col
                    break
            if col_result:
                processados = set(df_result[col_result].dropna().astype(str).str.strip())
        except Exception as e:
            print(f"Erro ao ler arquivo de resultados: {e}")

    # Busca o arquivo de erros mais recente, se não for passado
    if not nome_arquivo_erros:
        arquivos_erros = glob.glob(os.path.join(
            os.path.expanduser('~'), 'Desktop', 'Macro JGL', 'Macro Consulta Geral', 'Erros_Consulta_Geral-*.csv'))
        if arquivos_erros:
            nome_arquivo_erros = max(arquivos_erros, key=os.path.getctime)
    if nome_arquivo_erros and os.path.exists(nome_arquivo_erros):
        try:
            df_erros = pd.read_csv(nome_arquivo_erros, sep=';', encoding='utf-8-sig')
            col_erro = None
            for col in ['PDE', 'HIDRO', 'Hidrometro']:
                if col in df_erros.columns:
                    col_erro = col
                    break
            if col_erro:
                erros = set(df_erros[col_erro].dropna().astype(str).str.strip())
        except Exception as e:
            print(f"Erro ao ler arquivo de erros: {e}")

    # Remove os já processados e já com erro
    lista_filtrada = [item for item in lista_os if str(item).strip() not in processados and str(item).strip() not in erros]
    return lista_filtrada

class WaitTimeoutError(Exception):
    pass

def wait_forever(driver, condition, poll_frequency=0.5, max_wait=25):
    """
    Espera até que a condição seja satisfeita, mas nunca mais que max_wait segundos.
    """
    import time
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, NoSuchElementException

    start = time.time()
    while True:
        try:
            return WebDriverWait(driver, 1).until(condition)
        except (TimeoutException, StaleElementReferenceException, NoSuchElementException):
            if (time.time() - start) > max_wait:
                raise WaitTimeoutError(f"Elemento não encontrado após {max_wait} segundos.")
            time.sleep(poll_frequency)
            
def adiciona_nao_encontrado_template_pde(item_value, lock):
    from datetime import datetime
    import os
    import pandas as pd
    dados = {
        "PDE": item_value,
        "Registro": "NÃO ENCONTRADO",
        "Status": "NÃO ENCONTRADO",
        "PDE/HIDRO": "NÃO ENCONTRADO",
        "Tipo de Ligação": "NÃO ENCONTRADO",
        "ATC": "NÃO ENCONTRADO",
        "Endereço": "NÃO ENCONTRADO",
        "Tipo de Ponto": "NÃO ENCONTRADO",
        "Data de Ligação Agua": "NÃO ENCONTRADO",
        "Diâmetro:": "NÃO ENCONTRADO",
        "SITIA": "NÃO ENCONTRADO",
        "Status SITIA": "NÃO ENCONTRADO",
        "Data de Ligação Esgoto": "NÃO ENCONTRADO",
        "SITIE": "NÃO ENCONTRADO",
        "Status SITIE": "NÃO ENCONTRADO"
    }
    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Macro Consulta Geral')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_file_path = os.path.join(output_dir, f'Erros_Consulta_Geral-{data_formatada}.csv')
    df = pd.DataFrame([dados])
    try:
        os.makedirs(output_dir, exist_ok=True)
    except Exception as e:
        print(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")
    file_exists = os.path.exists(output_file_path)
    with lock:
        if file_exists:
            df.to_csv(output_file_path, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
        else:
            df.to_csv(output_file_path, index=False, encoding="UTF-8-SIG", sep=";")

def adiciona_nao_encontrado_template_hidro(item_value, lock):
    from datetime import datetime
    import os
    import pandas as pd
    dados = {
        "HIDRO": item_value,
        "Registro": "NÃO ENCONTRADO",
        "Status": "NÃO ENCONTRADO",
        "PDE/HIDRO": "NÃO ENCONTRADO",
        "Tipo de Ligação": "NÃO ENCONTRADO",
        "ATC": "NÃO ENCONTRADO",
        "Endereço": "NÃO ENCONTRADO",
        "Tipo de Ponto": "NÃO ENCONTRADO",
        "Data de Ligação Agua": "NÃO ENCONTRADO",
        "Diâmetro:": "NÃO ENCONTRADO",
        "SITIA": "NÃO ENCONTRADO",
        "Status SITIA": "NÃO ENCONTRADO",
        "Data de Ligação Esgoto": "NÃO ENCONTRADO",
        "SITIE": "NÃO ENCONTRADO",
        "Status SITIE": "NÃO ENCONTRADO"
    }
    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Macro Consulta Geral')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_file_path = os.path.join(output_dir, f'Erros_Consulta_Geral-{data_formatada}.csv')
    df = pd.DataFrame([dados])
    try:
        os.makedirs(output_dir, exist_ok=True)
    except Exception as e:
        print(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")
    file_exists = os.path.exists(output_file_path)
    with lock:
        if file_exists:
            df.to_csv(output_file_path, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
        else:
            df.to_csv(output_file_path, index=False, encoding="UTF-8-SIG", sep=";")

def apagar_processada(item_value, lock):
    import os
    import pandas as pd
    arquivo = 'template.csv'
    with lock:
        if os.path.exists(arquivo):
            try:
                df = pd.read_csv(arquivo)
                if not df.empty:
                    initial_row_count = len(df)
                    df = df[df.iloc[:, 0].astype(str) != str(item_value)]
                    if len(df) < initial_row_count:
                        df.to_csv(arquivo, index=False)
            except FileNotFoundError:
                print(f"Arquivo {arquivo} não encontrado.")
            except Exception as e:
                print(f"Ocorreu um erro ao remover o item {item_value}: {e}")

def connect_to_database():
    import pymysql
    try:
        connection = pymysql.connect(
            host='10.51.109.123',
            user='root',
            password='SB28@sabesp',
            database='pendlist',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = connection.cursor()
        return connection, cursor
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None, None

def store_data_in_database(dados, identificador, nome_arquivo, tipo_arquivo):
    from datetime import datetime
    connection, cursor = connect_to_database()
    if not connection or not cursor:
        raise ItemProcessingError("Não foi possível estabelecer conexão com o banco de dados")
    try:
        def convert_date_for_db(date_str):
            if not date_str or date_str == "NÃO ENCONTRADO":
                return None
            try:
                date_str = date_str.split()[0].strip()
                date_str = date_str.split('-')[0].strip()
                date_obj = datetime.strptime(date_str, '%d/%m/%Y')
                return date_obj.strftime('%Y-%m-%d')
            except (ValueError, AttributeError) as e:
                print(f"Erro ao converter data {date_str}: {str(e)}")
                return None
        values = [
            dados.get('PDE') or dados.get('Hidrometro'),
            dados.get('Fornecimento'),
            dados.get('Codificacao'),
            dados.get('Tipo Mercado'),
            dados.get('Status Fornecimento'),
            dados.get('Titular'),
            dados.get('Tipo Sujeito'),
            dados.get('Celular'),
            dados.get("Email"),
            dados.get('Endereço Fornecimento'),
            dados.get('Tipo Fornecimento'),
            dados.get('Oferta/Produto'),
            dados.get('Entrega Fatura'),
            dados.get('Condição de Pagamento'),
            dados.get('Modo de Envio'),
            dados.get('Grupo Faturamento'),
            dados.get('Data Proxima Leitura'),
            dados.get('Numero de Residencias'),
            dados.get('Status Atual'),
            dados.get('ATC'),
            dados.get('Tipo de Cavalete'),
            convert_date_for_db(dados.get('Data de Ligação Agua')),
            dados.get('Diâmetro:'),
            dados.get('SITIA'),
            dados.get('Status SITIA'),
            convert_date_for_db(dados.get('Data de Ligação Esgoto')),
            dados.get('SITIE'),
            dados.get('Status SITIE'),
            identificador,
            tipo_arquivo,
            nome_arquivo
        ]
        sql = """
        INSERT INTO tb_consulta_geral (
            pde_hidro, fornecimento, codificacao, tipo_mercado, status_fornecimento,
            titular, tipo_sujeito, celular, email, endereco, tipo_fornecimento,
            oferta_produto, entrega_fatura, condicao, modo_de_envio,
            grupo_faturamento, data_proxima_leitura, numero_de_residencias,
            status_atual, atc, tipo_de_cavalete, data_de_ligacao_agua,
            diametro, sitia, status_sitia, data_de_ligacao_esgoto,
            sitie, status_sitie, autor, tipo_arquivo, nome_arquivo
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                 %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, values)
        connection.commit()
        print("Dados armazenados com sucesso no banco de dados")
        return True
    except Exception as e:
        error_msg = f"Erro ao inserir dados no banco: {str(e)}"
        print(error_msg)
        print("Valores que causaram erro:", values)
        connection.rollback()
        raise ItemProcessingError(error_msg) from e
    finally:
        cursor.close()
        connection.close()

def armazena_final(dados, lock, identificador, nome_arquivo, tipo_arquivo):
    from datetime import datetime
    import os
    import pandas as pd
    # Exige apenas o campo principal conforme o tipo
    if tipo_arquivo and str(tipo_arquivo).lower() in ["hidro", "hidrometro"]:
        if not ((dados.get("HIDRO") and dados["HIDRO"].strip() != "") or (dados.get("Hidrometro") and dados["Hidrometro"].strip() != "")):
            print(f"Aviso: Campo obrigatório 'HIDRO' ou 'Hidrometro' não encontrado ou vazio nos dados")
            return False
    else:
        if not (dados.get("PDE") and dados["PDE"].strip() != ""):
            print(f"Aviso: Campo obrigatório 'PDE' não encontrado ou vazio nos dados")
            return False
    try:
        print(f"Tentando armazenar dados com identificador: {identificador}")
        print(f"Nome do arquivo: {nome_arquivo}")
        print(f"Tipo do arquivo: {tipo_arquivo}")
        stored_in_db = store_data_in_database(dados, identificador, nome_arquivo, tipo_arquivo)
        if not stored_in_db:
            print("Falha ao armazenar dados no banco")
    except Exception as e:
        print(f"Erro ao armazenar no banco: {e}")
    try:
        desktop_path = get_desktop_path()
        output_dir = os.path.join(desktop_path, 'Macro JGL', 'Macro Consulta Geral')
        now = datetime.now()
        data_formatada = now.strftime("%d_%m_%Y")
        output_file_path = os.path.join(output_dir, f'Resultado_Consulta_Geral-{data_formatada}.csv')
        os.makedirs(output_dir, exist_ok=True)
        df = pd.DataFrame([dados])
        file_exists = os.path.exists(output_file_path)
        with lock:
            if file_exists:
                df.to_csv(output_file_path, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
            else:
                df.to_csv(output_file_path, index=False, encoding="UTF-8-SIG", sep=";")
        return True
    except Exception as e:
        print(f"Erro ao salvar CSV: {e}")
        return False


def login(thread_id, l_login=None, s_senha=None):
    from selenium.webdriver.edge.options import Options
    from selenium import webdriver
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import TimeoutException, UnexpectedAlertPresentException
    import threading

    options = Options()
    options.add_argument("--incognito")
    options.add_argument("--headless") 
    options.add_argument("--disable-gpu") 
    options.page_load_strategy = 'normal'
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-extensions")
    options.add_argument("--guest")
    options.add_experimental_option("prefs", {
        'download.prompt_for_download': False,
        'download.directory_upgrade': True,
        'safeBrowse.enabled': True,
        "profile.default_content_setting_values.notifications": 2
    })
    driver = None
    try:
        print(f"Thread {threading.current_thread().name} - Inicializando driver...")
        driver = webdriver.ChromiumEdge(options=options) # Supondo Edge, se for Chrome, mudar para webdriver.Chrome
        with driver_lock:
            active_drivers.append(driver)
        print(f"Thread {threading.current_thread().name} - Driver inicializado.")
        url_login = "https://conecta.sabesp.com.br/NETAinf/login.aspx"
        url_destino_pos_login = 'https://conecta.sabesp.com.br/NETASIU/SIUWeb/SiuWeb.Crm/Forms/DashBoards/RicercaCliente.aspx'
        
        print(f"Thread {threading.current_thread().name} - Abrindo Navegador e navegando para {url_login}...")
        driver.get(url_login)
        print(f"Thread {threading.current_thread().name} - Página de login carregada.")
        driver.maximize_window()
        
        print(f"Thread {threading.current_thread().name} - Esperando pelos campos de login...")
        username_field = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.ID, "extended_login_Username")))
        password_field = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.ID, "extended_login_Password")))
        login_button = WebDriverWait(driver, 30).until(EC.element_to_be_clickable((By.ID, "extended_login_Login")))
        print(f"Thread {threading.current_thread().name} - Campos de login encontrados. Inserindo Login e Senha...")
        
        username_field.send_keys(l_login if l_login else '1') # Credenciais padrão se não fornecidas
        password_field.send_keys(s_senha if s_senha else '1') # Credenciais padrão se não fornecidas
        
        print(f"Thread {threading.current_thread().name} - Clicando no botão de login...")
        login_button.click()
        
        print(f"Thread {threading.current_thread().name} - Navegando diretamente para a página de busca: {url_destino_pos_login}")
        driver.get(url_destino_pos_login)
        try:
            print(f"Thread {threading.current_thread().name} - Esperando por elemento chave na página de busca...")
            WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[4]")))
            print(f"Thread {threading.current_thread().name} - Elemento chave encontrado. Login realizado com sucesso.")
        except (TimeoutException, UnexpectedAlertPresentException) as e:
            print(f"Thread {threading.current_thread().name} - Erro de login: {str(e)}")
            if driver:
                driver.quit()
            return {"status": "error", "message": "Login ou senha inválidos no NETA. Tente novamente."}
        return driver
    except Exception as e:
        print(f"Thread {threading.current_thread().name} - Erro crítico durante o login: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        if driver:
            driver.quit()
        return None

def monitor_progresso():
    from datetime import datetime
    import time

    print("\nIniciando monitoramento do progresso...")
    global tempo_inicial_global, processados, erros, total_processar, monitor_stop_event, current_os_being_processed, current_os_lock

    while True:
        if monitor_stop_event.is_set():
            print("[MONITOR] monitor_stop_event setado. Encerrando monitoramento.")
            break
        with counter_lock:
            proc = processados
            err = erros
            total = total_processar

        with current_os_lock:
            os_atual_para_frontend = current_os_being_processed
        
        completos = proc + err
        restantes = total - completos

        print(f"\rProcessando: {os_atual_para_frontend} | Processados: {proc}/{total} | Erros: {err} | Restantes: {restantes}      ", end='', flush=True)

        porcentagem_str = "0%"
        if total > 0:
            porcentagem_val = (completos / total) * 100
            porcentagem_str = f"{porcentagem_val:.0f}%"

        tempo_estimado_str = "Calculando..."
        if tempo_inicial_global:
             tempo_decorrido_total_segundos = (datetime.now() - tempo_inicial_global).total_seconds()
             if completos > 0:
                 tempo_medio_por_item_atual = tempo_decorrido_total_segundos / completos
                 segundos_restantes_estimados = tempo_medio_por_item_atual * restantes
                 if segundos_restantes_estimados > 0:
                     h = int(segundos_restantes_estimados // 3600)
                     m = int((segundos_restantes_estimados % 3600) // 60)
                     s = int(segundos_restantes_estimados % 60)
                     tempo_estimado_str = f"{h:02d}h {m:02d}m {s:02d}s" if h > 0 else f"{m:02d}m {s:02d}s"
                 else:
                     tempo_estimado_str = "Concluindo..."
        else:
            tempo_estimado_str = "Iniciando..."

        dados_para_frontend = {
            "os_processando": os_atual_para_frontend,
            "quantidade": proc,
            "total_count": total,
            "oserros": err,
            "tempoestimado": tempo_estimado_str,
            "porcentagem_concluida": porcentagem_str,
            "finalizado": False
        }

        if eel:
            try:
                eel.update_progress(dados_para_frontend)
            except Exception as e_eel:
                print(f"Erro ao chamar eel.update_progress: {e_eel}")
                pass

        # Se todos os itens foram processados, finalize o monitor
        if total > 0 and completos >= total:
            print("[MONITOR] Todos os itens processados. Encerrando monitoramento.")
            break
        # Aguarda 1 segundo, mas sai imediatamente se o evento for setado
        if monitor_stop_event.wait(1):
            print("[MONITOR] monitor_stop_event setado durante wait. Encerrando monitoramento.")
            break

    with counter_lock:
        proc_final = processados
        err_final = erros
        total_final = total_processar
    completos_final = proc_final + err_final

    print(f"\rProcessados: {proc_final}/{total_final} | Erros: {err_final} - FIM      ", flush=True)

    dados_finais_frontend = {
        "os_processando": "Concluído",
        "quantidade": proc_final,
        "total_count": total_final,
        "oserros": err_final,
        "tempoestimado": "00m 00s",
        "porcentagem_concluida": "100%" if total_final > 0 and completos_final == total_final else f"{((completos_final / total_final) * 100) if total_final > 0 else 0:.0f}%",
        "finalizado": True,
        "start_datetime": tempo_inicial_global.strftime("%d/%m/%Y às %H:%M:%S") if tempo_inicial_global else "",
        "end_datetime": datetime.now().strftime("%d/%m/%Y às %H:%M:%S"),
        "processed_count": proc_final,
        "error_count": err_final,
        "total_time": formatar_tempo_legivel(int((datetime.now() - tempo_inicial_global).total_seconds())) if tempo_inicial_global else "",
        "macro_concluida": True
    }
    if eel:
        try:
            eel.update_progress(dados_finais_frontend)
        except Exception as e_eel:
            print(f"Erro ao chamar eel.update_progress (final): {e_eel}")
    # Chama o toast de conclusão no frontend
    # if eel and hasattr(eel, 'mostrarToast'):
    #     try:
    #         eel.mostrarToast()
    #     except Exception as e:
    #         print(f"Erro ao chamar eel.mostrarToast: {e}")


def macro(driver, item_value, item_type, current_file_lock, first_column_value, identificador=None, nome_arquivo=None, tipo_arquivo=None):
    from selenium.webdriver.support.ui import WebDriverWait, Select
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import StaleElementReferenceException, NoSuchElementException, WebDriverException, TimeoutException
    import time
    import sys
    import threading
    import traceback

    print(f"\nThread {threading.current_thread().name} - Processando {item_type} {str(first_column_value).strip()}", flush=True)
    processed_successfully = False

    try:
        # Verifica se está pausado antes de iniciar processamento
        while pause_event.is_set() and not monitor_stop_event.is_set():
            print(f"Thread {threading.current_thread().name} - Em pausa...", flush=True)
            time.sleep(1)

        if monitor_stop_event.is_set():
            raise ItemProcessingError("Processamento interrompido pelo usuário")

        time.sleep(2)  # Aumentado tempo de espera após refresh
        current_url = driver.current_url
        if 'RicercaCliente.aspx' not in current_url:
            print(f"\nThread {threading.current_thread().name} - Navegando para página de busca para {str(first_column_value).strip()}.", flush=True)
            driver.get('https://conecta.sabesp.com.br/NETASIU/SIUWeb/SiuWeb.Crm/Forms/DashBoards/RicercaCliente.aspx')
            wait_nav = WebDriverWait(driver, 45)  # Aumentado timeout para 45 segundos
            wait_nav.until(lambda driver: 'RicercaCliente.aspx' in driver.current_url and
                         driver.execute_script('return document.readyState') == 'complete')

        time.sleep(0.5)
        item_type_lower = item_type.lower() # Usar uma variável local para evitar modificar o parâmetro
        processed_value_str = str(first_column_value).strip()
        # NOVO: Remove parte decimal se houver (ex: 2000050651.0 -> 2000050651)
        if '.' in processed_value_str:
            processed_value_str = processed_value_str.split('.')[0]
        print(f"Thread {threading.current_thread().name} - Valor a ser processado após split: {processed_value_str}")

        dados = {} # Inicializa o dicionário de dados aqui

        if item_type_lower in ["hidro", "hidrometro"]:
            print(f"Thread {threading.current_thread().name} - Iniciando busca específica para HIDRO: {processed_value_str}", flush=True)
            # --- Lógica de busca e extração para HIDRO ---
            # (Mantida a lógica original de cliques e extração, mas sem incrementar contadores)
            try:
                # Clicar em "Busca por Endereço"

                busca_endereco = wait_forever(driver, EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/div[1]/ul[2]/li[2]/a")))
                busca_endereco.click()
                time.sleep(0.5)  # Aumentado tempo de espera após clique

                input_field_hidro = wait_forever(driver, EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr[1]/td[3]/div/fieldset/input[2]")))
                input_field_hidro.clear()
                time.sleep(0.5)  # Aumentado tempo de espera após clique

                input_field_hidro.send_keys(processed_value_str)

                bnt_pesquisa = wait_forever(driver, EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[2]/td[2]/input[4]")))
                bnt_pesquisa.click()
                time.sleep(0.5)  # Aumentado tempo de espera após clique

                # Clique robusto no botão de detalhe (protege contra StaleElementReferenceException)
                from selenium.common.exceptions import StaleElementReferenceException
                for tentativa_stale in range(3):
                    try:
                        bnt_busca_detalhe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[2]/td[2]/input[2]")))
                        bnt_busca_detalhe.click()
                        break  # Sucesso
                    except StaleElementReferenceException:
                        print(f"Thread {threading.current_thread().name} - StaleElementReferenceException ao clicar no botão de detalhe, tentativa {tentativa_stale+1}/3. Tentando novamente...")
                        time.sleep(1)
                else:
                    raise Exception("Falha ao clicar no botão de detalhe após 3 tentativas devido a StaleElementReferenceException")
                time.sleep(0.5)  # Aumentado tempo de espera após clique

                wait_forever(driver, invisibility_or_absence((By.ID, "ctl00_lbl_ese_incorso")))
                print(f"Thread {threading.current_thread().name} - Sequência de busca HIDRO concluída para {processed_value_str}. Iniciando Extração...", flush=True)
              
                try: # Try para extração de dados do HIDRO

                    iframe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
                    driver.switch_to.frame(iframe)
                    painel_fornecimento = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[15]')))
                    painel_fornecimento.click()
                    time.sleep(0.5)  # Aumentado tempo de espera após clique

                    wait_forever(driver, invisibility_or_absence((By.ID, "ctl00_lbl_ese_incorso")))

                    driver.switch_to.default_content()

                    iframe_utenza = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoUtenza"]')))
                    driver.switch_to.frame(iframe_utenza)

                    print("inicando extração de dados do painel FORNECIMENTO...")
                    dados['Hidrometro'] = processed_value_str
                    dados['Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[1]/span[2]'))).text
                    dados['Codificacao'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[2]/span[2]'))).text
                    dados['PDE'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[2]/span[2]'))).text
                    dados['Tipo Mercado'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[3]/span[2]'))).text
                    dados['Status Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[2]'))).text
                    dados['Titular'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[4]'))).text
                    dados['Tipo Sujeito'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[6]'))).text
                    dados['Celular'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[8]'))).text
                    dados['Endereço Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[10]/span[2]'))).text
                    dados['Tipo Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[13]'))).text
                    dados['Oferta/Produto'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[15]'))).text
                    dados['Entrega Fatura'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[17]'))).text
                    dados['Condição de Pagamento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[19]'))).text
                    dados['Modo de Envio'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[2]/tbody/tr/td[1]/span[2]'))).text
                    dados['Grupo Faturamento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[3]/tbody/tr/td[1]/span[2]'))).text
                    dados['Data Proxima Leitura'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[3]/tbody/tr/td[3]/span[2]'))).text
                    dados['Numero de Residencias'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[21]'))).text
                    # print(dados)
        
                    driver.switch_to.default_content()
                    fechar_painel_fornecimento = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[5]/table/tbody/tr/td[1]/div/div/ul/li[2]/a/span/input')))
                    fechar_painel_fornecimento.click()

      
                    iframe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
                    driver.switch_to.frame(iframe)

                   
                    painel_element_sitia = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[13]')))
                    painel_element_sitia.click()
 
                    driver.switch_to.default_content()
           
                    iframe_detail_sit = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="NETAModalDialogiFrame_1"]')))
                    driver.switch_to.frame(iframe_detail_sit)


                    print("inicando extração de dados do painel SITIA/SITIE...")
                    dados['Status Atual'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[1]/td[2]/span/table/tbody/tr[3]/td/table/tbody/tr[1]/td[1]/table/tbody/tr[1]/td[2]/span'))).text
                    dados['ATC'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[2]/td/div/fieldset/p[8]/input'))).get_attribute('value')
                    tipo_pde_elemento = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[4]/td/div/fieldset/p[2]/select')))
                    tipo_pde_select = Select(tipo_pde_elemento)
                    dados['Tipo de Cavalete'] = tipo_pde_select.first_selected_option.text
                    dados['Data de Ligação Agua'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/span[2]/input[1]'))).get_attribute('value')
                    dados['Diâmetro:'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/p[2]/span[2]/input[1]'))).get_attribute('value')
                    dados['SITIA'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/p[8]/span[2]/input[1]'))).get_attribute('value') # Note: Same
                    dados['Status SITIA'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/p[8]/span[2]/input[3]'))).get_attribute('value')
                    dados['Data de Ligação Esgoto'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[2]/fieldset/span[2]/input[1]'))).get_attribute('value')
                    dados['SITIE'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[2]/fieldset/p[2]/span[2]/input[1]'))).get_attribute('value')
                    dados['Status SITIE'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[2]/fieldset/p[2]/span[2]/input[3]'))).get_attribute('value')
                    # print(dados)

                    driver.switch_to.default_content()
                    fechar_painel_sitia = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/div/div[1]/div[1]/button/span[1]')))
                    fechar_painel_sitia.click()

                    iframe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
                    driver.switch_to.frame(iframe)

                   
                    painel_cliente = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[14]')))
                    painel_cliente.click()

                    driver.switch_to.default_content()

                    iframe_clit = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoCliente"]')))
                    driver.switch_to.frame(iframe_clit)
                    print("iframe acessado")

                    print("Extração de dados do painel CLIENTE iniciada...")
                    dados['Celular'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[1]/fieldset/table/tbody/tr[4]/td[3]/span[2]'))).text
                    dados['Email'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[1]/fieldset/table/tbody/tr[5]/td[3]/span[2]'))).text
                    print(dados)

                    driver.switch_to.default_content()

                    fechar_painel_cliente = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[5]/table/tbody/tr/td[1]/div/div/ul/li[2]/a/span/input')))
                    fechar_painel_cliente.click()
              
                    armazena_final(dados, current_file_lock, identificador, nome_arquivo, tipo_arquivo) # Passa todos os argumentos necessários
                    processed_successfully = True # Define sucesso APÓS armazenar
                   

                    try:
                       
                        botao_fechar = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_TabCRM_bli_tcrm_cruscotti"]/li/a/span/input')))
                        botao_fechar.click()
                   
                    except Exception: # NoSuchElementException ou TimeoutException
                        print(f"Thread {threading.current_thread().name} - Botão de fechar detalhe não encontrado/clicável (HIDRO).")
                
                except TimeoutException:
                    print(f"Thread {threading.current_thread().name} - Timeout durante a extração de dados para HIDRO {processed_value_str} (Timeout/WaitTimeoutError).")
                    traceback.print_exc(file=sys.stdout) # Adicionado para detalhar o timeout
                    # processed_successfully permanece False
                except Exception as e_extract:
                    print(f"Thread {threading.current_thread().name} - Erro durante a extração de dados para HIDRO {processed_value_str}: {e_extract}")
                    traceback.print_exc(file=sys.stdout)
                    # processed_successfully permanece False
            
            except TimeoutException: # Para a sequência de busca HIDRO
                print(f"Thread {threading.current_thread().name} - Timeout na sequência de busca HIDRO para {processed_value_str}.")
                # processed_successfully permanece False
            except Exception as e_search_hidro: # Para a sequência de busca HIDRO
                print(f"Thread {threading.current_thread().name} - Erro na sequência de busca HIDRO para {processed_value_str}: {e_search_hidro}")
                traceback.print_exc(file=sys.stdout)
                # processed_successfully permanece False

        elif item_type_lower == "pde":
            print(f"Thread {threading.current_thread().name} - Iniciando busca PDE: {processed_value_str}", flush=True)
            xpath_pde = "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[4]"
            
            try:
                input_field_pde = wait_forever(driver, EC.presence_of_element_located((By.XPATH, xpath_pde)))
                
                pde_original = processed_value_str  # Definir antes de qualquer manipulação
                pde_to_search = pde_original
                print(f"Thread {threading.current_thread().name} - Valor PDE original: {pde_to_search}", flush=True)
                
                if pde_to_search.isdigit() and len(pde_to_search) < 10:
                    zeros_a_adicionar = 10 - len(pde_to_search)
                    pde_to_search = '0' * zeros_a_adicionar + pde_to_search
                    print(f"Thread {threading.current_thread().name} - PDE formatado com zeros: {pde_to_search}", flush=True)
                elif not pde_to_search.isdigit():
                    pde_original = processed_value_str  # Garante que está definido
                    print(f"Thread {threading.current_thread().name} - AVISO: PDE não é um número válido: {pde_original}")
                    # Não incrementa erro nem grava arquivo aqui! Apenas retorna para tentar de novo
                    return  # Corrige: era 'continue', mas aqui é função, então deve ser 'return'

                input_field_pde.clear()
             
                input_field_pde.send_keys(pde_to_search)
   
                print(f"Thread {threading.current_thread().name} - PDE inserido no campo de busca: {pde_to_search}", flush=True)
                
                button_pde = wait_forever(driver, EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[2]/td/input[3]")))
                button_pde.click()
                wait_forever(driver, invisibility_or_absence((By.ID, "ctl00_lbl_ese_incorso")))

                try: # Try para extração de dados do HIDRO

                    iframe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
                    driver.switch_to.frame(iframe)
                    painel_fornecimento = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[15]')))
                    painel_fornecimento.click()
                    time.sleep(0.5)  # Aumentado tempo de espera após clique

                    wait_forever(driver, invisibility_or_absence((By.ID, "ctl00_lbl_ese_incorso")))

                    driver.switch_to.default_content()

                    iframe_utenza = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoUtenza"]')))
                    driver.switch_to.frame(iframe_utenza)

                    print("inicando extração de dados do painel FORNECIMENTO...")
                    dados['Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[1]/span[2]'))).text
                    dados['Codificacao'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[2]/span[2]'))).text
                    dados['PDE'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[2]/span[2]'))).text
                    dados['Tipo Mercado'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[3]/span[2]'))).text
                    dados['Status Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[2]'))).text
                    dados['Titular'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[4]'))).text
                    dados['Tipo Sujeito'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[6]'))).text
                    dados['Celular'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[8]'))).text
                    dados['Endereço Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[10]/span[2]'))).text
                    dados['Tipo Fornecimento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[13]'))).text
                    dados['Oferta/Produto'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[15]'))).text
                    dados['Entrega Fatura'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[17]'))).text
                    dados['Condição de Pagamento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[19]'))).text
                    dados['Modo de Envio'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[2]/tbody/tr/td[1]/span[2]'))).text
                    dados['Grupo Faturamento'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[3]/tbody/tr/td[1]/span[2]'))).text
                    dados['Data Proxima Leitura'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[3]/tbody/tr/td[3]/span[2]'))).text
                    dados['Numero de Residencias'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[21]'))).text
                    # print(dados)
        
                    driver.switch_to.default_content()
                    fechar_painel_fornecimento = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[5]/table/tbody/tr/td[1]/div/div/ul/li[2]/a/span/input')))
                    fechar_painel_fornecimento.click()

      
                    iframe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
                    driver.switch_to.frame(iframe)

                   
                    painel_element_sitia = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[13]')))
                    painel_element_sitia.click()
 
                    driver.switch_to.default_content()
           
                    iframe_detail_sit = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="NETAModalDialogiFrame_1"]')))
                    driver.switch_to.frame(iframe_detail_sit)


                    print("inicando extração de dados do painel SITIA/SITIE...")
                    dados['Status Atual'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[1]/td[2]/span/table/tbody/tr[3]/td/table/tbody/tr[1]/td[1]/table/tbody/tr[1]/td[2]/span'))).text
                    dados['ATC'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[2]/td/div/fieldset/p[8]/input'))).get_attribute('value')
                    tipo_pde_elemento = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[4]/td/div/fieldset/p[2]/select')))
                    tipo_pde_select = Select(tipo_pde_elemento)
                    dados['Tipo de Cavalete'] = tipo_pde_select.first_selected_option.text
                    dados['Data de Ligação Agua'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/span[2]/input[1]'))).get_attribute('value')
                    dados['Diâmetro:'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/p[2]/span[2]/input[1]'))).get_attribute('value')
                    dados['SITIA'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/p[8]/span[2]/input[1]'))).get_attribute('value') # Note: Same
                    dados['Status SITIA'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[1]/fieldset/p[8]/span[2]/input[3]'))).get_attribute('value')
                    dados['Data de Ligação Esgoto'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[2]/fieldset/span[2]/input[1]'))).get_attribute('value')
                    dados['SITIE'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[2]/fieldset/p[2]/span[2]/input[1]'))).get_attribute('value')
                    dados['Status SITIE'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[6]/td/fieldset/div[2]/fieldset/p[2]/span[2]/input[3]'))).get_attribute('value')
                    # print(dados)

                    driver.switch_to.default_content()
                    fechar_painel_sitia = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/div/div[1]/div[1]/button/span[1]')))
                    fechar_painel_sitia.click()

                    iframe = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
                    driver.switch_to.frame(iframe)

                   
                    painel_cliente = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[14]')))
                    painel_cliente.click()

                    driver.switch_to.default_content()

                    iframe_clit = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ifCruscottoCliente"]')))
                    driver.switch_to.frame(iframe_clit)
                    print("iframe acessado")

                    print("Extração de dados do painel CLIENTE iniciada...")
                    dados['Celular'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[1]/fieldset/table/tbody/tr[4]/td[3]/span[2]'))).text
                    dados['Email'] = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/div[1]/fieldset/table/tbody/tr[5]/td[3]/span[2]'))).text
                    print(dados)

                    driver.switch_to.default_content()

                    fechar_painel_cliente = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[5]/table/tbody/tr/td[1]/div/div/ul/li[2]/a/span/input')))
                    fechar_painel_cliente.click()
              
                    armazena_final(dados, current_file_lock, identificador, nome_arquivo, tipo_arquivo) # Passa todos os argumentos necessários
                    processed_successfully = True # Define sucesso APÓS armazenar
                   

                    try:

                        botao_fechar = wait_forever(driver, EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_TabCRM_bli_tcrm_cruscotti"]/li/a/span/input')))
                        botao_fechar.click()

                    except Exception: # NoSuchElementException ou TimeoutException
                        print(f"Thread {threading.current_thread().name} - Botão de fechar detalhe não encontrado/clicável (PDE).")
                
                except TimeoutException:
                    print(f"Thread {threading.current_thread().name} - Timeout durante a extração de dados para PDE {processed_value_str} (Timeout/WaitTimeoutError).")
                    traceback.print_exc(file=sys.stdout) # Adicionado para detalhar o timeout
                    # processed_successfully permanece False
                except Exception as e_extract_pde:
                    print(f"Thread {threading.current_thread().name} - Erro durante a extração de dados para PDE {processed_value_str}: {e_extract_pde}")
                    traceback.print_exc(file=sys.stdout)
                    # processed_successfully permanece False

            except (TimeoutException, WaitTimeoutError): # Para a busca PDE inicial
                 print(f"Thread {threading.current_thread().name} - Timeout na busca PDE inicial para {processed_value_str} (Timeout/WaitTimeoutError).")
                 # processed_successfully permanece False
            except Exception as e_search_pde: # Para a busca PDE inicial
                 print(f"Thread {threading.current_thread().name} - Erro na busca PDE inicial para {processed_value_str}: {e_search_pde}")
                 traceback.print_exc(file=sys.stdout)
                 # processed_successfully permanece False
        else:
            print(f"Thread {threading.current_thread().name} - Tipo de item inválido recebido na macro: {item_type}. Item: {processed_value_str}", flush=True)
            processed_successfully = False # Falha explícita

        # Se, após toda a lógica, o item não foi processado com sucesso, levanta uma exceção.
        # Isso será pego pela thread_task para contabilizar como erro.
        if not processed_successfully:
            raise ItemProcessingError(f"Processamento do item {item_type} '{processed_value_str}' falhou (lógica interna da macro).")

    except ItemProcessingError: # Se a exceção ItemProcessingError foi levantada acima ou por erro crítico
        processed_successfully = False # Garante que está False para o bloco finally
        raise # Re-levanta para ser pega pela thread_task
    except (StaleElementReferenceException, NoSuchElementException, WebDriverException, TimeoutException, WaitTimeoutError) as selenium_ex:
        # Captura exceções críticas de Selenium não tratadas internamente que indicam falha no processamento do item
        print(f"\nThread {threading.current_thread().name} - Erro crítico de Selenium na macro para {item_type} {str(first_column_value).strip()}: {selenium_ex}", flush=True)
        traceback.print_exc(file=sys.stdout)
        processed_successfully = False # Falha
        raise ItemProcessingError(f"Erro Selenium '{type(selenium_ex).__name__}' ao processar {item_type} {str(first_column_value).strip()}") from selenium_ex
    except Exception as e_general:
        # Captura qualquer outra exceção inesperada
        print(f"\nThread {threading.current_thread().name} - Erro geral inesperado na macro para {item_type} {str(first_column_value).strip()}: {e_general}", flush=True)
        traceback.print_exc(file=sys.stdout)
        processed_successfully = False # Falha
        raise ItemProcessingError(f"Erro inesperado '{type(e_general).__name__}' ao processar {item_type} {str(first_column_value).strip()}") from e_general
    finally:

        apagar_processada(first_column_value, current_file_lock)



def thread_task(thread_id, items_chunk, item_type, current_file_lock, current_counter_lock, l_login=None, s_senha=None, identificador=None, nome_arquivo=None, tipo_arquivo=None):
    global current_os_being_processed, current_os_lock
    global processados, erros

    print(f"Thread {threading.current_thread().name} started. Tipo de pesquisa: {item_type}", flush=True)
    driver = None

    MAX_RELOGIN_ATTEMPTS = 3  # Número máximo de tentativas de reabrir o navegador

    try:
        driver = login(thread_id, l_login, s_senha)
        if isinstance(driver, dict) and driver.get("status") == "error":
            print(f"Thread {threading.current_thread().name} - Erro de login detectado: {driver.get('message')}", flush=True)
            return
    except Exception as e:
        print(f"Thread {threading.current_thread().name} - Erro ao inicializar driver: {e}", flush=True)
        driver = None

    for item_value in items_chunk:
        attempts = 0
        processed = False
        while not processed:
            try:
                attempts = 0
                # Tenta processar o item até o limite de tentativas
                while attempts < MAX_RELOGIN_ATTEMPTS and not processed:
                    # Tenta reabrir o navegador infinitamente até conseguir
                    while driver is None:
                        try:
                            print(f"Thread {threading.current_thread().name} - Tentando reabrir driver...", flush=True)
                            driver = login(thread_id, l_login, s_senha)
                            if isinstance(driver, dict) and driver.get("status") == "error":
                                print(f"Thread {threading.current_thread().name} - Erro de login detectado (relogin): {driver.get('message')}", flush=True)
                                driver = None
                        except Exception as e:
                            print(f"Thread {threading.current_thread().name} - Erro ao tentar reabrir driver: {e}", flush=True)
                            driver = None
                        if driver is None:
                            print(f"Thread {threading.current_thread().name} - Falha ao abrir navegador, tentando novamente em 5 segundos...", flush=True)
                            time.sleep(5)

                   

                    with current_os_lock:
                        current_os_being_processed = str(item_value).strip()

                    print(f"Thread {threading.current_thread().name} - Processando item {item_value} com tipo {item_type} (tentativa {attempts+1}/{MAX_RELOGIN_ATTEMPTS})", flush=True)
                    try:
                        macro(driver, item_value, item_type, current_file_lock, item_value, 
                              identificador=identificador, 
                              nome_arquivo=nome_arquivo, 
                              tipo_arquivo=tipo_arquivo)
                        with current_counter_lock:
                            processados += 1
                        processed = True  # Sucesso!
                    except Exception as e_macro:
                        print(f"Thread {threading.current_thread().name} - Erro ao processar item {item_value} (tentativa {attempts+1}): {e_macro}", flush=True)
                        # Fecha o driver e força reabrir na próxima tentativa
                        if driver:
                            try:
                                with driver_lock:
                                    if driver in active_drivers:
                                        active_drivers.remove(driver)
                                driver.quit()
                            except Exception as e_close:
                                print(f"Thread {threading.current_thread().name} - Erro ao fechar driver após falha: {e_close}", flush=True)
                        attempts += 1  # Tenta de novo
                # Só conta erro e grava no CSV de erro após TODAS as tentativas falharem
                if not processed and attempts >= MAX_RELOGIN_ATTEMPTS:
                    with current_counter_lock:
                        erros += 1
                    if item_type.lower() == "pde":
                                               adiciona_nao_encontrado_template_pde(item_value, current_file_lock)
                    elif item_type.lower() in ["hidro", "hidrometro"]:
                        adiciona_nao_encontrado_template_hidro(item_value, current_file_lock)
                    processed = True  # Marca como processado para não entrar em loop infinito
            except Exception as e_fatal:
                print(f"Thread {threading.current_thread().name} - Erro inesperado no processamento do item {item_value}: {e_fatal}", flush=True)
                print(f"Thread {threading.current_thread().name} - Esperando 5 segundos antes de tentar novamente o mesmo item...", flush=True)
                time.sleep(5)
        # Só conta erro e grava no CSV de erro após TODAS as tentativas falharem
        if not processed and attempts >= MAX_RELOGIN_ATTEMPTS:
            with current_counter_lock:
                erros += 1
            # Só grava no arquivo de erro após todas as tentativas falharem
            if item_type.lower() == "pde":
                adiciona_nao_encontrado_template_pde(item_value, current_file_lock)
            elif item_type.lower() in ["hidro", "hidrometro"]:
                adiciona_nao_encontrado_template_hidro(item_value, current_file_lock)

    # Ao final, fecha o driver se existir
    if driver:
        with driver_lock:
            if driver in active_drivers:
                active_drivers.remove(driver)
        driver.quit()
        print(f"\nThread {threading.current_thread().name} terminou e saiu do driver.", flush=True)

def thread_task_dynamic(item_queue, item_type, current_file_lock, current_counter_lock, l_login=None, s_senha=None, identificador=None, nome_arquivo=None, tipo_arquivo=None, progress_queue=None):
    global current_os_being_processed, current_os_lock
    global processados, erros, total_processar, tempo_inicial_global

    driver = None
    MAX_RELOGIN_ATTEMPTS = 3  # Corrigido para 3 tentativas, igual ao processamento em lista

    print(f"Thread {threading.current_thread().name} INICIOU")
    while True:
        try:
            # Envolve todo o loop principal em try/except amplo
            if driver is None:
                try:
                    driver = login(threading.current_thread().name, l_login, s_senha)
                    if isinstance(driver, dict) and driver.get("status") == "error":
                        print(f"Thread {threading.current_thread().name} - Erro de login detectado: {driver.get('message')}", flush=True)
                        driver = None
                        print(f"Thread {threading.current_thread().name} - Tentando novamente login em 5 segundos...")
                        time.sleep(5)
                        continue
                except Exception as e:
                    print(f"Thread {threading.current_thread().name} - Erro ao inicializar driver: {e}", flush=True)
                    driver = None
                    print(f"Thread {threading.current_thread().name} - Tentando novamente login em 5 segundos...")
                    time.sleep(5)
                    continue

            try:
                item = item_queue.get(timeout=3)
            except queue.Empty:
                print(f"Thread {threading.current_thread().name} FINALIZOU (fila vazia)")
                break
            attempts = 0
            processed = False
            while attempts < MAX_RELOGIN_ATTEMPTS and not processed:
                while driver is None:
                    try:
                        driver = login(threading.current_thread().name, l_login, s_senha)
                        if isinstance(driver, dict) and driver.get("status") == "error":
                            print(f"Thread {threading.current_thread().name} - Erro de login detectado (relogin): {driver.get('message')}", flush=True)
                            driver = None
                            print(f"Thread {threading.current_thread().name} - Tentando novamente login em 5 segundos...")
                            time.sleep(5)
                            continue
                    except Exception as e:
                        print(f"Thread {threading.current_thread().name} - Erro ao tentar reabrir driver: {e}", flush=True)
                        driver = None
                        print(f"Thread {threading.current_thread().name} - Tentando novamente login em 5 segundos...")
                        time.sleep(5)
                        continue
                with current_os_lock:
                    current_os_being_processed = str(item).strip()
                try:
                    macro(driver, item, item_type, current_file_lock, item,
                          identificador=identificador,
                          nome_arquivo=nome_arquivo,
                          tipo_arquivo=tipo_arquivo)
                    with current_counter_lock:
                        processados += 1
                    processed = True
                except Exception as e_macro:
                    print(f"Thread {threading.current_thread().name} - Erro ao processar item {item} (tentativa {attempts+1}): {e_macro}", flush=True)
                    if driver:
                        try:
                            with driver_lock:
                                if driver in active_drivers:
                                    active_drivers.remove(driver)
                            driver.quit()
                        except Exception as e_close:
                            print(f"Thread {threading.current_thread().name} - Erro ao fechar driver após falha: {e_close}", flush=True)
                    attempts += 1  # Tenta de novo
            # Só conta erro e grava no CSV de erro após TODAS as tentativas falharem
            if not processed and attempts >= MAX_RELOGIN_ATTEMPTS:
                with current_counter_lock:
                    erros += 1
                # Só grava no arquivo de erro após todas as tentativas falharem
                if item_type.lower() == "pde":
                    adiciona_nao_encontrado_template_pde(item, current_file_lock)
                elif item_type.lower() in ["hidro", "hidrometro"]:
                    adiciona_nao_encontrado_template_hidro(item, current_file_lock)
            # Envio de progresso parcial após cada item processado (sucesso ou erro)
            if progress_queue is not None:
                with current_counter_lock, current_os_lock:
                    completos = processados + erros
                    restantes = total_processar - completos
                    porcentagem_str = "0%"
                    if total_processar > 0:
                        porcentagem_val = (completos / total_processar) * 100
                        porcentagem_str = f"{porcentagem_val:.0f}%"

                    tempo_estimado_str = "Calculando..."
                    if tempo_inicial_global and completos > 0:
                        tempo_decorrido_total_segundos = (datetime.now() - tempo_inicial_global).total_seconds()
                        tempo_medio_por_item_atual = tempo_decorrido_total_segundos / completos
                        segundos_restantes_estimados = tempo_medio_por_item_atual * restantes
                        if segundos_restantes_estimados > 0:
                            h = int(segundos_restantes_estimados // 3600)
                            m = int((segundos_restantes_estimados % 3600) // 60)
                            s = int(segundos_restantes_estimados % 60)
                            tempo_estimado_str = f"{h:02d}h {m:02d}m {s:02d}s" if h > 0 else f"{m:02d}m {s:02d}s"
                        else:
                            tempo_estimado_str = "Concluindo..."
                    elif not tempo_inicial_global:
                        tempo_estimado_str = "Iniciando..."
                    dados_parciais = {
                        "os_processando": current_os_being_processed,
                        "quantidade": processados,
                        "total_count": total_processar,
                        "oserros": erros,
                        "tempoestimado": tempo_estimado_str,
                        "porcentagem_concluida": porcentagem_str,
                        "finalizado": False
                    }
                    progress_queue.put(dados_parciais)
            item_queue.task_done()
        except Exception as e_fatal:
            print(f"Thread {threading.current_thread().name} - Exceção inesperada global: {e_fatal}", flush=True)
            traceback.print_exc(file=sys.stdout)
            if driver:
                try:
                    with driver_lock:
                        if driver in active_drivers:
                            active_drivers.remove(driver)
                    driver.quit()
                except Exception as e_close:
                    print(f"Thread {threading.current_thread().name} - Erro ao fechar driver após exceção global: {e_close}", flush=True)
                driver = None
            print(f"Thread {threading.current_thread().name} - Reiniciando ciclo após exceção global em 5 segundos...")
            time.sleep(5)
            continue
    if driver:
        with driver_lock:
            if driver in active_drivers:
                active_drivers.remove(driver)
        driver.quit()
        print(f"Thread {threading.current_thread().name} FINALIZOU (driver encerrado)")

# (Fim da função thread_task_dynamic)
# Não deve haver nenhum bloco de ajuste de threads, criação de item_queue ou threads aqui fora de função!

@eel.expose
def iniciar_macro_consulta_geral(conteudo_base64, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_pesquisa, num_browsers=5, identificador=None, progress_queue=None):
    from datetime import datetime
    import pandas as pd
    import io
    import base64

    global total_processar, processados, erros, tempo_inicial_global, current_os_being_processed

    print("[DEBUG] Início da função iniciar_macro_consulta_geral")
    print(f"[DEBUG] Timestamp (início da função iniciar_macro_consulta_geral): {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')}")
    try:
        print("[DEBUG] Decodificando arquivo recebido...")
        if tipo_arquivo == 'csv':
            conteudo_decodificado = base64.b64decode(conteudo_base64).decode('utf-8')
            df = pd.read_csv(io.StringIO(conteudo_decodificado), sep=';', encoding='utf-8-sig') 
        elif tipo_arquivo == 'excel':
            conteudo_decodificado = base64.b64decode(conteudo_base64)
            df = pd.read_excel(io.BytesIO(conteudo_decodificado))
        else:
            if hasattr(eel, 'display_macro_error_frontend'): eel.display_macro_error_frontend('Tipo de arquivo não suportado.')
            return {"status": "erro", "message": "Tipo de arquivo não suportado."}
        print("[DEBUG] Arquivo decodificado e lido com sucesso.")
    except Exception as e:
        if hasattr(eel, 'display_macro_error_frontend'): eel.display_macro_error_frontend(f'Erro ao carregar arquivo: {str(e)}')
        return {"status": "erro", "message": f"Erro ao carregar arquivo: {str(e)}"}

    if df.empty:
        if hasattr(eel, 'display_macro_error_frontend'): eel.display_macro_error_frontend('Arquivo enviado está vazio.')
        return {"status": "erro", "message": "Arquivo enviado está vazio."}

    print("[DEBUG] Iniciando análise das colunas e preparação da lista de OS...")
    colunas_esperadas = ['PDE', 'pde', 'Pde', 'hidro', 'HIDRO', 'Hidro', 'HIDROMETRO']
    lista_os = None
    coluna_encontrada = None
    linha_hidro = None
    idx_col_hidro = None

    if all(str(col).startswith('Unnamed') for col in df.columns):
        found = False
        for row_idx in range(df.shape[0]):
            for col_idx in range(df.shape[1]):
                valor = str(df.iat[row_idx, col_idx]).strip().lower()
                if any(palavra in valor for palavra in ["hidro", "hidrometro"]):
                    idx_col_hidro = col_idx
                    coluna_encontrada = df.columns[idx_col_hidro]
                    linha_hidro = row_idx
                    found = True
                    break
            if found:
                break
        if idx_col_hidro is not None and linha_hidro is not None:
            lista_os = df.iloc[linha_hidro+1:, idx_col_hidro].dropna().astype(str).tolist()
        else:
            lista_os = df.iloc[:, 0].dropna().astype(str).tolist()
            coluna_encontrada = df.columns[0]
    else:
        for col in df.columns:
            if col in colunas_esperadas:
                lista_os = df[col].dropna().astype(str).tolist()
                coluna_encontrada = col
                break
        if lista_os is None:
            if not df.empty and len(df.columns) > 0:
                primeira_coluna = df.columns[0]
                lista_os = df[primeira_coluna].dropna().astype(str).tolist()
                coluna_encontrada = primeira_coluna
            else:
                if hasattr(eel, 'display_macro_error_frontend'): eel.display_macro_error_frontend('Arquivo não contém colunas de dados.')
                return {"status": "erro", "message": "Arquivo não contém colunas de dados."}

    print(f"[DEBUG] Lista de OS/PDE/HIDRO preparada. Quantidade: {len(lista_os) if lista_os else 0}")
    if not lista_os:
        if hasattr(eel, 'display_macro_error_frontend'): eel.display_macro_error_frontend('Nenhuma OS/PDE/HIDRO encontrada no arquivo para processar.')
        return {"status": "erro", "message": "Nenhuma OS/PDE/HIDRO encontrada no arquivo para processar."}

    if (
        tipo_pesquisa.lower() in ["hidro", "hidrometro"]
        and coluna_encontrada is not None
        and not (linha_hidro is not None and idx_col_hidro is not None)
    ):
        lista_os = df[coluna_encontrada].dropna().astype(str).tolist()

    total_processar = len(lista_os)
    processados = 0 
    erros = 0     

    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_dir = os.path.join(os.path.expanduser('~'), 'Desktop', 'Macro JGL', 'Macro Consulta Geral')
    nome_arquivo_resultado = os.path.join(output_dir, f'Resultado_Consulta_Geral-{data_formatada}.csv')
    nome_arquivo_erros = os.path.join(output_dir, f'Erros_Consulta_Geral-{data_formatada}.csv')

    print("[DEBUG] Iniciando filtragem dos itens já processados...")
    lista_os = filtrar_itens_nao_processados(lista_os, nome_arquivo_resultado, nome_arquivo_erros)
    print(f"[DEBUG] Lista de OS após filtragem: {len(lista_os)}")

    processados = 0
    erros = 0
    print("[DEBUG] Lendo arquivos de resultado e erro para contagem...")
    if os.path.exists(nome_arquivo_resultado):
        try:
            df_result = pd.read_csv(nome_arquivo_resultado, sep=';', encoding='utf-8-sig')
            processados = len(df_result)
        except Exception as e:
            print(f"Erro ao contar processados no arquivo de resultados: {e}")

    if os.path.exists(nome_arquivo_erros):
        try:
            df_erros = pd.read_csv(nome_arquivo_erros, sep=';', encoding='utf-8-sig')
            erros = len(df_erros)
        except Exception as e:
            pass  # Ignora erros ao ler arquivo de erros

    print(f"[DEBUG] Processados contados: {processados}, Erros contados: {erros}")

    print("[DEBUG] Preparando variáveis globais e locks...")
    with current_os_lock:
        current_os_being_processed = "Calculando..." 
    tempo_inicial_global = datetime.now()
    monitor_stop_event.clear()
    pause_event.clear()
    stop_event.clear()

    print("[DEBUG] Iniciando thread de monitoramento de progresso...")
    monitor_thread = threading.Thread(target=monitor_progresso, daemon=True)
    monitor_thread.start()

    if hasattr(eel, 'display_macro_processing_status_frontend'):
        eel.display_macro_processing_status_frontend(f"Iniciando processamento de {total_processar} itens...")

    threads = []
    num_browsers = int(num_browsers)
    if num_browsers < 1:
        num_browsers = 1
    if num_browsers > total_processar and total_processar > 0:
        num_browsers = total_processar
    if total_processar == 0:
        print("Nenhum item a processar. Nenhuma thread será criada.")
        monitor_stop_event.set()
        if hasattr(eel, 'display_macro_error_frontend'):
            eel.display_macro_error_frontend('Nenhum item a processar.')
        return {"status": "erro", "message": "Nenhum item a processar."}
    else:
        print(f"Serão criadas {num_browsers} threads para {total_processar} itens.")

    print("[DEBUG] Criando fila de itens para processamento...")
    item_queue = queue.Queue()
    for item in lista_os:
        item_queue.put(item)

    print("[DEBUG] Iniciando threads de processamento...")
    threads = []
    for i in range(num_browsers):
        t = threading.Thread(
            target=thread_task_dynamic,
            args=(item_queue, tipo_pesquisa, file_lock, counter_lock, 
                  login_usuario, senha_usuario),
            kwargs={
                'identificador': identificador or login_usuario,
                'nome_arquivo': nome_arquivo,
                'tipo_arquivo': tipo_arquivo,
                'progress_queue': progress_queue
            },
            name=f"Browser-{i+1}"
        )
        threads.append(t)
        t.start()

    print("[DEBUG] Aguardando todas as threads terminarem...")
    for t in threads:
        t.join() 

    item_queue.join()
    print("Todos os itens foram processados ou marcados como erro.")

    # Bloco extra: garantir que nada fique pendente na fila após o join
    if not item_queue.empty():
        print("Itens restantes na fila após processamento:")
        while not item_queue.empty():
            try:
                item_restante = item_queue.get_nowait()
                print(f"Item não processado: {item_restante}")
                # Marca como erro também
                with counter_lock:
                    erros += 1
                if tipo_pesquisa.lower() == "pde":
                    adiciona_nao_encontrado_template_pde(item_restante, file_lock)
                elif tipo_pesquisa.lower() in ["hidro", "hidrometro"]:
                    adiciona_nao_encontrado_template_hidro(item_restante, file_lock)
                item_queue.task_done()
            except queue.Empty:
                break

    monitor_stop_event.set() 
    monitor_thread.join() 

    tempo_final_global = datetime.now() # Renomeado para não confundir com outras variáveis tempo_final
    tempo_total_exec = tempo_final_global - tempo_inicial_global 
    tempo_str = formatar_tempo_legivel(int(tempo_total_exec.total_seconds()))

    dados_finais_completos = {
        "os_processando": "Concluído",
        "quantidade": processados,
        "total_count": total_processar,
        "oserros": erros,
        "tempoestimado": "00m 00s",
        "porcentagem_concluida": "100%" if total_processar > 0 and (processados + erros) == total_processar else f"{(((processados + erros) / total_processar) * 100) if total_processar > 0 else 0:.0f}%",
        "finalizado": True,
        "start_datetime": tempo_inicial_global.strftime("%d/%m/%Y às %H:%M:%S") if tempo_inicial_global else "",
        "end_datetime": tempo_final_global.strftime("%d/%m/%Y às %H:%M:%S"),
        "processed_count": processados,
        "error_count": erros,
        "total_time": tempo_str,
        "macro_concluida": True  # <--- ADDED FLAG
    }
    if progress_queue:
        progress_queue.put(dados_finais_completos)
        progress_queue.put('END')
    elif eel and hasattr(eel, 'update_progress'):
        try:
            eel.update_progress(dados_finais_completos)
        except Exception as e_eel_final:
            print(f"Erro ao chamar eel.update_progress (dados finais completos): {e_eel_final}")

    print("[LOG] Função iniciar_macro_consulta_geral terminou completamente e retornou para o frontend.")
    # if eel and hasattr(eel, 'mostrarToast'):
    #     try:
    #         eel.mostrarToast()
    #     except Exception as e:
    #         print(f"Erro ao chamar eel.mostrarToast: {e}")
    return {"status": "sucesso", "message": f"Processamento concluído em {tempo_str}."}
