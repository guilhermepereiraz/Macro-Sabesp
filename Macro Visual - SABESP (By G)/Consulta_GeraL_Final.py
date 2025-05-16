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
import threading  # Importar o módulo threading
import numpy as np # Import numpy for splitting the list
import sys # Para sys.exit()
import traceback # Para imprimir stacktraces
import eel  # Adiciona importação do eel para integração com frontend

# Variáveis globais para contagem
total_processar = 0
processados = 0
erros = 0

# Locks para acesso thread-safe a recursos compartilhados
file_lock = threading.Lock()
counter_lock = threading.Lock()

# Evento para sinalizar o thread de monitoramento a parar
monitor_stop_event = threading.Event()



def adiciona_nao_encontrado_template_pde(item_value, file_lock):
    # Esta função agora recebe o valor do item não encontrado e o lock
    import logging
    dados = {
        "Valor Buscado": item_value, # Adiciona o valor buscado
        "Tipo Buscado": "PDE", # Adiciona o tipo buscado
        "Registro": "NÃO ENCONTRADO",
        "Status": "NÃO ENCONTRADO",
        "PDE/HIDRO": "NÃO ENCONTRADO", # Alterado para refletir que pode ser PDE ou HIDRO não encontrado
        "Tipo de Ligação": "NÃO ENCONTRADO",
        "ATC": "NÃO ENCONTRADO",
        "Endereço": "NÃO ENCONTRADO",
        "Tipo de Ponto": "NÃO ENCONTRADO", # Alterado para Ponto
        "Data de Ligação Agua": "NÃO ENCONTRADO",
        "Diâmetro:": "NÃO ENCONTRADO",
        "SITIA": "NÃO ENCONTRADO",
        "Status SITIA": "NÃO ENCONTRADO",
        "Data de Ligação Esgoto": "NÃO ENCONTRADO",
        "SITIE": "NÃO ENCONTRADO",
        "Status SITIE": "NÃO ENCONTRADO"
    }
    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Consulta Geral')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_file_path = os.path.join(output_dir, f'Erros_Consulta_Geral-{data_formatada}.csv')
    df = pd.DataFrame([dados])
    try:
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Estrutura de pastas criada ou já existente: {output_dir}")
    except Exception as e:
        logging.error(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")
    file_exists = os.path.exists(output_file_path)
    with file_lock:
        if file_exists:
            df.to_csv(output_file_path, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
            logging.info(f"Erro anexado ao arquivo: {output_file_path}")
        else:
            df.to_csv(output_file_path, index=False, encoding="UTF-8-SIG", sep=";")
            logging.info(f"Novo arquivo de erro criado: {output_file_path}")


def adiciona_nao_encontrado_template_hidro(item_value, file_lock):
    # Esta função agora recebe o valor do item não encontrado e o lock
    import logging
    dados = {
        "Valor Buscado": item_value, # Adiciona o valor buscado
        "Tipo Buscado": "HIDROMETRO", # Adiciona o tipo buscado
        "Registro": "NÃO ENCONTRADO",
        "Status": "NÃO ENCONTRADO",
        "PDE/HIDRO": "NÃO ENCONTRADO", # Alterado para refletir que pode ser PDE ou HIDRO não encontrado
        "Tipo de Ligação": "NÃO ENCONTRADO",
        "ATC": "NÃO ENCONTRADO",
        "Endereço": "NÃO ENCONTRADO",
        "Tipo de Ponto": "NÃO ENCONTRADO", # Alterado para Ponto
        "Data de Ligação Agua": "NÃO ENCONTRADO",
        "Diâmetro:": "NÃO ENCONTRADO",
        "SITIA": "NÃO ENCONTRADO",
        "Status SITIA": "NÃO ENCONTRADO",
        "Data de Ligação Esgoto": "NÃO ENCONTRADO",
        "SITIE": "NÃO ENCONTRADO",
        "Status SITIE": "NÃO ENCONTRADO"
    }
    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Consulta Geral')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_file_path = os.path.join(output_dir, f'Erros_Consulta_Geral-{data_formatada}.csv')
    df = pd.DataFrame([dados])
    try:
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Estrutura de pastas criada ou já existente: {output_dir}")
    except Exception as e:
        logging.error(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")
    file_exists = os.path.exists(output_file_path)
    with file_lock:
        if file_exists:
            df.to_csv(output_file_path, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
            logging.info(f"Erro anexado ao arquivo: {output_file_path}")
        else:
            df.to_csv(output_file_path, index=False, encoding="UTF-8-SIG", sep=";")
            logging.info(f"Novo arquivo de erro criado: {output_file_path}")


def apagar_processada(item_value, file_lock):
    """
    Lê o arquivo 'template.csv', remove a linha correspondente ao item_value e salva as alterações.
    Usa um lock para garantir acesso thread-safe ao arquivo.
    Recebe o valor do item a ser removido.
    """
    arquivo = 'template.csv'

    with file_lock: # Usa o lock para acesso thread-safe
        if os.path.exists(arquivo):
            try:
                df = pd.read_csv(arquivo)
                if not df.empty:
                    initial_row_count = len(df)
                     # Remove a linha onde a primeira coluna (convertida para string) é igual ao item_value (convertido para string)
                    df = df[df.iloc[:, 0].astype(str) != str(item_value)]
                    if len(df) < initial_row_count:
                        df.to_csv(arquivo, index=False)
                        # print(f"Item {item_value} removido com sucesso de {arquivo}.")
                    # else:
                         # print(f"Item {item_value} não encontrado em {arquivo} para remoção.")
                # else:
                    # print(f"O arquivo {arquivo} está vazio.")
            except FileNotFoundError:
                print(f"Arquivo {arquivo} não encontrado.")
            except Exception as e:
                print(f"Ocorreu um erro ao remover o item {item_value}: {e}")
        # else:
            # print(f"Arquivo {arquivo} não encontrado.")


def armazena_final(dados, file_lock):
    """
    Armazena os dados extraídos em um arquivo CSV na pasta Macro JGL/Consulta Geral na área de trabalho.
    Usa um lock para garantir acesso thread-safe ao arquivo.
    """
    import logging
    home_dir = os.path.expanduser('~')
    output_dir = os.path.join(home_dir, 'Desktop', 'Macro JGL', 'Macro Consulta Geral')
    now = datetime.now()
    data_formatada = now.strftime("%d_%m_%Y")
    output_file_path = os.path.join(output_dir, f'Resultado_Consulta_Geral-{data_formatada}.csv')
    df = pd.DataFrame([dados])

    try:
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Estrutura de pastas criada ou já existente: {output_dir}")
    except Exception as e:
        logging.error(f"Erro ao criar a estrutura de pastas {output_dir}: {e}")

    file_exists = os.path.exists(output_file_path)

    with file_lock:
        try:
            if file_exists:
                df.to_csv(output_file_path, mode="a", header=False, index=False, encoding="UTF-8-SIG", sep=";")
                logging.info(f"Dados anexados ao arquivo: {output_file_path}")
            else:
                df.to_csv(output_file_path, index=False, encoding="UTF-8-SIG", sep=";")
                logging.info(f"Novo arquivo criado: {output_file_path}")
        except Exception as e:
            logging.error(f"Erro ao salvar os dados no arquivo CSV {output_file_path}: {e}")


def login(thread_id, l_login=None, s_senha=None):
    """
    Inicializa o driver e faz login no site NETA usando as credenciais fornecidas.
    Se l_login e s_senha não forem passados, usa os valores padrão.
    """
    options = Options()
    options.add_argument("--incognito")
    # options.add_argument("--headless") # Deixa o navegador invisivel
    # options.add_argument("--disable-gpu") # Deixa o navegador invisivel
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
        driver = webdriver.ChromiumEdge(options=options)
        print(f"Thread {threading.current_thread().name} - Driver inicializado.")
        url_login = "https://conecta.sabesp.com.br/NETAinf/login.aspx"

        print("Abrindo Navegador")

        url_destino_pos_login = 'https://conecta.sabesp.com.br/NETASIU/SIUWeb/SiuWeb.Crm/Forms/DashBoards/RicercaCliente.aspx'
        print(f"Thread {threading.current_thread().name} - Navegando para {url_login}...")
        driver.get(url_login)
        print(f"Thread {threading.current_thread().name} - Página de login carregada.")
        driver.maximize_window()
        wait = WebDriverWait(driver, 40)
        print(f"Thread {threading.current_thread().name} - Esperando pelos campos de login (USER/PASSWORD/LOGIN)...")
        username_field = wait.until(
            EC.presence_of_element_located((By.ID, "extended_login_Username"))
        )
        password_field = wait.until(
            EC.presence_of_element_located((By.ID, "extended_login_Password"))
        )
        login_button = wait.until(
            EC.element_to_be_clickable((By.ID, "extended_login_Login"))
        )
        print(f"Thread {threading.current_thread().name} - Campos de login encontrados.")
        # Usa as credenciais passadas, se não, usa padrão

        print("Inserindo Login e Senha")

        username_field.send_keys(l_login if l_login else '530572')
        password_field.send_keys(s_senha if s_senha else '!Q2w3e4r')
        print(f"Thread {threading.current_thread().name} - Clicando no botão de login...")
        login_button.click()
        print(f"Thread {threading.current_thread().name} - Botão de login clicado. Aguardando página pós-login...")
        print(f"Thread {threading.current_thread().name} - Navegando diretamente para a página de busca: {url_destino_pos_login}")
        driver.get(url_destino_pos_login)
        try:
            print(f"Thread {threading.current_thread().name} - Esperando por elemento chave na página de busca (após navegação direta)...")
            wait.until(
                EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[4]"))
            )
            print(f"Thread {threading.current_thread().name} - Elemento chave na página de busca encontrado.")
        except TimeoutException:
            print(f"Thread {threading.current_thread().name} - Timeout ({wait._timeout}s) esperando pelo elemento chave na página de busca APÓS navegação direta.")
            print(f"Thread {threading.current_thread().name} - URL atual no momento do timeout: {driver.current_url}")
            if driver:
                print(f"Thread {threading.current_thread().name} - Fechando driver devido a timeout no login/navegação direta.")
                driver.quit()
            return None
        print(f"Thread {threading.current_thread().name} - Login realizado com sucesso e página de busca pronta.")
        return driver
    except Exception as e:
        print(f"Thread {threading.current_thread().name} - Erro crítico durante o login: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        if driver:
            print(f"Thread {threading.current_thread().name} - Fechando driver devido a erro no login.")
            driver.quit()
        return None


# Função para monitorar e imprimir o progresso no console
def monitor_progresso():
    """
    Função alvo para o thread de monitoramento.
    Imprime o progresso no console periodicamente.
    """
    print("\nIniciando monitoramento do progresso...") # Imprime uma linha para separar o monitoramento

    while not monitor_stop_event.is_set(): # Continua rodando até o evento de parada ser acionado
        with counter_lock: # Acessa os contadores globais de forma segura
            proc = processados
            err = erros
            total = total_processar # Total é lido uma vez no início do script principal

        completos = proc + err
        restantes = total - completos

        # Imprime o progresso na mesma linha
        # \r volta o cursor para o início da linha
        print(f"\rProcessados: {proc}/{total} | Erros: {err} | Restantes: {restantes}", end='', flush=True)

        # Espera um pouco antes de atualizar novamente, ou até que o evento de parada seja acionado
        # use o wait() do evento para que ele possa ser interrompido rapidamente
        monitor_stop_event.wait(5) # Espera por 5 segundos ou até o evento ser setado

    # Imprime a linha final para garantir que o último status completo seja mostrado
    with counter_lock:
        proc = processados
        err = erros
        total = total_processar
    completos = proc + err
    restantes = total - completos
    print(f"\rProcessados: {proc}/{total} | Erros: {err} | Restantes: {restantes} - FIM      ", flush=True) # Adiciona espaços para limpar a linha anterior


# Função macro adaptada para processar um único item (baseado no padrão do MacroSITE_V4)
# Esta função encapsula a lógica principal de busca e extração para um item
def macro(driver, first_column_value, item_type, file_lock, counter_lock):
    global processados, erros # Necessário para modificar os contadores globais

    # Log detalhado do início do processamento
    print(f"\nThread {threading.current_thread().name} - Iniciando macro para:")
    print(f"- Tipo de pesquisa: {item_type}")
    print(f"- Valor: {str(first_column_value).strip()}")


    wait = WebDriverWait(driver, 10) # Espera local para este driver (tempo para ações DENTRO da macro)

    # Flag para rastrear se o item foi processado/encontrado com sucesso na única tentativa
    processed_successfully = False
    driver.refresh() # Atualiza a página para garantir que está limpa antes de buscar
    try:
        # Navegar de volta para a página de busca se não estiver nela
        current_url = driver.current_url
        # Verifica se a URL atual contém 'RicercaCliente.aspx', se não, navega
        if 'RicercaCliente.aspx' not in current_url:
             print(f"\nThread {threading.current_thread().name} - Não estava na página de busca ({current_url}), navegando para processar {str(first_column_value).strip()}.", flush=True)
             driver.get('https://conecta.sabesp.com.br/NETASIU/SIUWeb/SiuWeb.Crm/Forms/DashBoards/RicercaCliente.aspx')
             # Adicionado uma espera explícita robusta após a navegação para garantir que a página de busca carregou
             # Usando um timeout maior para esta navegação crítica se necessário
             wait_nav = WebDriverWait(driver, 30) # Timeout maior para navegação
             wait_nav.until(EC.presence_of_element_located((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[4]")))
             print(f"\nThread {threading.current_thread().name} - Navegou de volta para a página de busca para {str(first_column_value).strip()}.", flush=True)


        # --- Lógica da ÚNICA tentativa de busca e extração de dados ---
        # Pequena espera pode ser útil para estabilizar a página após navegação/refresh
        time.sleep(0.5)        # Garantir que item_type seja tratado de forma consistente
        item_type = item_type.lower().strip()

        # Determinar o XPath com base no tipo de pesquisa
        if item_type == "pde":
            xpath = "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[4]"
            print(f"Thread {threading.current_thread().name} - Tipo de pesquisa PDE detectado", flush=True)
        elif item_type in ["hidro", "hidrometro"]:
            xpath = "/html/body/form/div[4]/div[4]/table/tbody/tr[1]/td/div/div/fieldset/table/tbody/tr/td[3]/div/fieldset/input[3]"
            print(f"Thread {threading.current_thread().name} - Tipo de pesquisa HIDRO detectado", flush=True)
        else:
            raise ValueError(f"Tipo de pesquisa inválido: {item_type}")

        print(f"Thread {threading.current_thread().name} - Usando XPath: {xpath} para {item_type}", flush=True)

        try:
            input_field = wait.until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )

            print("Inserindo PDE|HIDRO no campo de pesquisa")

            if input_field.is_displayed():
                print(f"Thread {threading.current_thread().name} - Elemento encontrado e visível para {item_type}", flush=True)
            else:
                print(f"Thread {threading.current_thread().name} - Elemento encontrado, mas não visível para {item_type}", flush=True)
        except TimeoutException:
            print(f"Thread {threading.current_thread().name} - Timeout ao localizar o elemento para {item_type} com XPath: {xpath}", flush=True)
            raise

        processed_value = str(first_column_value).strip()
        # Verifica se o valor lido é numérico e se o comprimento é menor que 10
        if processed_value.isdigit() and len(processed_value) < 10:
            # Calcula quantos zeros precisam ser adicionados (10 - comprimento atual)
            zeros_a_adicionar = 10 - len(processed_value)
            processed_value = '0' * zeros_a_adicionar + processed_value
            print(f"\nThread {threading.current_thread().name} - Valor {str(first_column_value).strip()} tem menos de 10 caracteres, usando {processed_value} para buscar.", flush=True)
        # --- Fim da lógica de adição de '0' ---

        input_field.clear()
        time.sleep(0.5) # Pequena espera entre clear e send_keys
        input_field.send_keys(processed_value) # Envia o valor processado (com ou sem zero adicionado)

        button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "/html/body/form/div[4]/div[4]/table/tbody/tr[2]/td/input[3]"))
        )
        button.click()
        # Espera explícita pelos resultados da busca ou pelo iframe que indica o resultado
        # Usando um timeout maior aqui para a busca, pois pode demorar

        
        iframe = wait.until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="ifCruscottoPdr"]')))
        iframe.find_element(By.XPATH, '//*[@id="ifCruscottoPdr"]')
        driver.switch_to.frame(iframe)

        print("Extraindo dados do Painel de Fornecimento")

        painel_fornecimento = driver.find_element(By.XPATH, '//*[@id="ctl00_NetSiuCPH_btni_crm_crupdr_apricruf"]')
        painel_fornecimento.click()

        time.sleep(1)
        driver.switch_to.default_content()

        time.sleep(1)
        iframe = wait.until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="ifCruscottoUtenza"]')))
        iframe.find_element(By.XPATH, '//*[@id="ifCruscottoUtenza"]')
        driver.switch_to.frame(iframe)
     

        dados = {}

        dados['Fornecimento'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[1]/span[2]'))).text

        dados['PDE'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[2]/span[2]'))).text

        dados['Tipo Mercado'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[1]/tbody/tr/td[3]/span[2]'))).text

        dados['Status Fornecimento'] = wait.until(EC.presence_of_element_located((By.XPATH, '//html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[2]'))).text

        dados['Titular'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[4]'))).text     

        dados['Tipo Sujeito'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[6]'))).text             

        dados['Celular'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[8]'))).text   

        dados['Endereço Fornecimento'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[10]/span[2]'))).text

        dados['Tipo Fornecimento'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[13]'))).text

        dados['Oferta/Produto'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[15]'))).text

        dados['Entrega Fatura'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[17]'))).text

        dados['Condição de Pagamento'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[19]'))).text

        dados['Modo de Envio'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[2]/tbody/tr/td[1]/span[2]'))).text

        dados['Grupo Faturamento'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[3]/tbody/tr/td[1]/span[2]'))).text

        dados['Data Proxima Leitura'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/table[3]/tbody/tr/td[3]/span[2]'))).text

        dados['Numero de Residencias'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[4]/div[1]/div/table/tbody/tr[2]/td/table/tbody/tr/td/div/table/tbody/tr/td[1]/div[1]/fieldset/span[21]'))).text

        driver.switch_to.default_content()

        fechar_painel_fornecimento =  driver.find_element(By.XPATH, '/html/body/form/div[4]/div[5]/table/tbody/tr/td[1]/div/div/ul/li[2]/a/span/input')
        time.sleep(0.5) # Pequena espera antes de clicar
        fechar_painel_fornecimento.click()

        time.sleep(1)
        iframe = wait.until(
            EC.element_to_be_clickable((By.XPATH, '/html/body/form/div[4]/div[5]/iframe'))) 
        driver.switch_to.frame(iframe)

        print("Extraindo dados do Painel de SITE")

        painel_element_sitia = driver.find_element(By.XPATH, '/html/body/form/div[4]/div[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/input[13]')
        painel_element_sitia.click()

        print(f"\nThread {threading.current_thread().name} - Busca para {processed_value} encontrou resultados.", flush=True)

        driver.switch_to.default_content()

        iframe_detail = wait.until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="NETAModalDialogiFrame_1"]'))
        )
        driver.switch_to.frame(iframe_detail)

        dados['Status Atual'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[1]/td[2]/span/table/tbody/tr[3]/td/table/tbody/tr[1]/td[1]/table/tbody/tr[1]/td[2]/span'))).text
        dados['ATC'] = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[2]/td/div/fieldset/p[8]/input'))).get_attribute('value')
        tipo_pde_elemento = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/form/div[5]/span[1]/div/div/fieldset/table/tbody/tr/td/table/tbody/tr[4]/td/div/fieldset/p[2]/select')))
        tipo_pde_select = Select(tipo_pde_elemento)
        dados['Tipo de Cavalete'] = tipo_pde_select.first_selected_option.text
        dados['Data de Ligação Agua'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_dbx_pun_data_allaccio_txtIt"]'))).get_attribute('value')
        dados['Diâmetro:'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_lov_pun_port_pot_lim_Code"]'))).get_attribute('value')
        dados['SITIA'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_lov_pun_port_pot_lim_Code"]'))).get_attribute('value') # Note: Same 
        dados['Status SITIA'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_lov_pun_origine_pod_Description"]'))).get_attribute('value')
        dados['Data de Ligação Esgoto'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_dbx_pun_data_allaccio_2_txtIt"]'))).get_attribute('value')
        dados['SITIE'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_lov_pun_tipologia_pos_Code"]'))).get_attribute('value')
        dados['Status SITIE'] = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="ctl00_NetSiuCPH_lov_pun_tipologia_pos_Description"]'))).get_attribute('value')


        print(f"\nThread {threading.current_thread().name} - Dados extraídos para {item_type} {processed_value}", flush=True)
        
        driver.back()
        time.sleep(0.5) # Pequena espera

        fechar_paineis =  driver.find_element(By.XPATH, '/html/body/form/div[4]/div[4]/div[1]/ul[3]/li/a/span/input')
        time.sleep(0.5) # Pequena espera antes de clicar
        fechar_paineis.click()
        driver.switch_to.default_content()

        # Clicar no botão de fechar o detalhe (parece ser um botão no conteúdo padrão)
        try:
             # Wait.until(EC.element_to_be_clickable) é mais seguro que find_element para cliques
             botao_fechar = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[@id="ctl00_NetSiuCPH_TabCRM_bli_tcrm_cruscotti"]/li/a/span/input')))
             botao_fechar.click()
             # print("Botão 'chiudi_tab' clicado com sucesso.")
        except NoSuchElementException:
             print(f"\nThread {threading.current_thread().name} - Botão de fechar detalhe não encontrado após processar {processed_value}. Continuando...", flush=True)
        except Exception as e:
             print(f"\nThread {threading.current_thread().name} - Erro ao clicar no botão de fechar detalhe após processar {processed_value}:", flush=True)


        armazena_final(dados, file_lock) # Passa o lock
        with counter_lock: # Protege o acesso ao contador
             processados += 1
        processed_successfully = True # Marca como processado com sucesso

    except Exception as e:
         # Este except pega QUALQUER erro durante a busca/extração inicial
         print(f"\nThread {threading.current_thread().name} - Erro durante a busca/extração para {item_type} {str(first_column_value).strip()}: {e}", flush=True)
         traceback.print_exc(file=sys.stdout) # Imprime stacktrace no console
         processed_successfully = False # Marca como falha


    finally:
         # Este bloco é executado SEMPRE, garantindo que a OS seja removida do template.csv
         # e que os contadores de erro sejam atualizados SE a OS não foi processada com sucesso.

         # Sempre tenta apagar o item do arquivo de entrada, independentemente de sucesso ou falha
         # Passa o valor e o lock para apagar_processada
         # Usamos o valor ORIGINAL para garantir que a linha correta seja removida do template.csv
         # O arquivo de erros recebe o valor ORIGINAL também, com a indicação do tipo de busca
         apagar_processada(first_column_value, file_lock)

         # Se o item NÃO foi processado com sucesso (falhou na única tentativa)
         if not processed_successfully:
             # Adiciona ao arquivo de erros
             if item_type == "PDE":
                 adiciona_nao_encontrado_template_pde(first_column_value, file_lock) # Passa valor ORIGINAL e lock
             elif item_type == "HIDROMETRO":
                 adiciona_nao_encontrado_template_hidro(first_column_value, file_lock) # Passa valor ORIGINAL e lock
             else:
                 # Caso de tipo inválido, adicionar um erro genérico se necessário
                 print(f"\nThread {threading.current_thread().name} - Tipo de item inválido, não adicionando erro específico para {str(first_column_value).strip()}.", flush=True)

             # Atualiza o contador de erros
             with counter_lock: # Protege o acesso ao contador
                 global erros # Declaração global é necessária aqui no finalmente se for modificar
                 erros += 1
         #else:
             # Se processou com sucesso, o contador de processados já foi incrementado na seção try correspondente.


# Função para a tarefa de cada thread (baseado em processar_lote_thread do MacroSITE_V4)
def thread_task(thread_id, items_chunk, item_type, file_lock, counter_lock, l_login=None, s_senha=None):
    """
    Função executada por cada thread.
    Inicializa seu driver, faz login e processa seu pedaço de itens.
    """
    print(f"Thread {threading.current_thread().name} started. Tipo de pesquisa: {item_type}", flush=True)

    driver = None
    try:
        # Realiza o login para esta thread, obtendo sua instância de driver
        driver = login(thread_id, l_login, s_senha)

        if driver: # Só prossegue se o login for bem-sucedido
            # Itera sobre os itens no pedaço atribuído a esta thread
            for item_value in items_chunk:
                print(f"Thread {threading.current_thread().name} - Processando item {item_value} com tipo {item_type}", flush=True)
                
                # Chama a função macro adaptada para processar um único item
                # Passa o driver da thread, o valor do item, tipo e locks necessários
                macro(driver, item_value, item_type, file_lock, counter_lock)


    except Exception as e:
        # Em caso de erro crítico na thread (ex: falha no login que retorna None), imprimir stacktrace para diagnóstico
        print(f"\nThread {threading.current_thread().name} encountered a critical error: {e}", flush=True)
        traceback.print_exc(file=sys.stdout) # Imprime stacktrace no console


    finally:
        # Garante que o driver é fechado ao final da thread, independentemente de erros
        if driver:
            driver.quit()
            print(f"\nThread {threading.current_thread().name} terminou e saiu do driver.", flush=True)


def thread_macro_wrapper(item, item_type, file_lock, counter_lock, l_login=None, s_senha=None):
    global processados, erros
    driver = login(threading.current_thread().name, l_login, s_senha)
    try:
        macro(driver, item, item_type, file_lock, counter_lock)
        with counter_lock:
            processados += 1
    except Exception as e:
        with counter_lock:
            erros += 1
    finally:
        if driver:
            driver.quit()


@eel.expose
def iniciar_macro_consulta_geral(conteudo_base64, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_pesquisa, num_browsers=1):
    """
    Função exposta ao frontend para iniciar a macro Consulta Geral.
    Recebe os parâmetros do frontend, carrega o arquivo, inicia as threads e monitora o progresso.
    Agora recebe o tipo_pesquisa (pde/hidro) e repassa para o processamento.
    O parâmetro num_browsers define quantas instâncias (navegadores) serão abertas.
    """
    import base64
    import io
    global total_processar, processados, erros
    
    # Carregar arquivo enviado pelo frontend
    try:
        if tipo_arquivo == 'csv':
            conteudo_decodificado = base64.b64decode(conteudo_base64).decode('utf-8')
            df = pd.read_csv(io.StringIO(conteudo_decodificado), sep=';', encoding='utf-8')
        elif tipo_arquivo == 'excel':
            conteudo_decodificado = base64.b64decode(conteudo_base64)
            df = pd.read_excel(io.BytesIO(conteudo_decodificado))
        else:
            if hasattr(eel, 'display_macro_error_frontend'):
                eel.display_macro_error_frontend('Tipo de arquivo não suportado.')
            return {"status": "erro", "message": "Tipo de arquivo não suportado."}
    except Exception as e:
        if hasattr(eel, 'display_macro_error_frontend'):
            eel.display_macro_error_frontend(f'Erro ao carregar arquivo: {str(e)}')
        return {"status": "erro", "message": f"Erro ao carregar arquivo: {str(e)}"}

    if df.empty:
        if hasattr(eel, 'display_macro_error_frontend'):
            eel.display_macro_error_frontend('Arquivo enviado está vazio.')
        return {"status": "erro", "message": "Arquivo enviado está vazio."}

    # Determina a coluna de OS/PDE/HIDRO
    colunas_esperadas = ['PDE', 'pde', 'Pde', 'hidro', 'HIDRO', 'Hidro', 'HIDROMETRO']
    lista_os = None
    for col in colunas_esperadas:
        if col in df.columns:
            lista_os = df[col].dropna().tolist()
            break
    if lista_os is None or not lista_os:
        if hasattr(eel, 'display_macro_error_frontend'):
            eel.display_macro_error_frontend('Coluna de OS/PDE/HIDRO não encontrada no arquivo.')
        return {"status": "erro", "message": "Coluna de OS/PDE/HIDRO não encontrada no arquivo."}

    total_processar = len(lista_os)
    processados = 0
    erros = 0

    # Inicia o monitoramento do progresso em thread separada
    monitor_stop_event.clear()
    monitor_thread = threading.Thread(target=monitor_progresso, daemon=True)
    monitor_thread.start()

    tempo_inicial = datetime.now()
    if hasattr(eel, 'display_macro_processing_status_frontend'):
        eel.display_macro_processing_status_frontend(f"Iniciando processamento de {total_processar} itens...")

    threads = []
    # Divide a lista de itens em pedaços para cada navegador
    import numpy as np
    if num_browsers < 1:
        num_browsers = 1
    item_chunks = np.array_split(lista_os, num_browsers)
    for i in range(num_browsers):
        chunk = item_chunks[i].tolist()
        if chunk:
            t = threading.Thread(target=thread_task,
                                 args=(i, chunk, tipo_pesquisa, file_lock, counter_lock, login_usuario, senha_usuario),
                                 name=f"Browser-{i+1}")
            threads.append(t)
            t.start()

    for t in threads:
        t.join()

    monitor_stop_event.set()
    monitor_thread.join()

    tempo_final = datetime.now()
    tempo_total = tempo_final - tempo_inicial
    total_segundos = int(tempo_total.total_seconds())
    tempo_str = f"{total_segundos} segundos" if total_segundos < 60 else f"{total_segundos//60} min {total_segundos%60} s"

    if hasattr(eel, 'display_macro_completion_frontend'):
        eel.display_macro_completion_frontend(f"Processamento concluído em {tempo_str}.")

    return {"status": "sucesso", "message": f"Processamento concluído em {tempo_str}."}


if __name__ == "__main__":
    # --- Configuração e Início da Macro Multi-Thread ---

    modelo = str(input("Digite com qual voce vai filtra PDE / HIDROMETRO  (I / II): "))
    if modelo.lower() not in ["i", "ii", "1", "2"]:
        print("Modelo inválido. Por favor, insira 'I' ou 'II'.")
        sys.exit() # Sai do script se o modelo for inválido
    else:
        item_type = "PDE" if modelo.lower() in ["i", "1"] else "HIDROMETRO"

        # --- Define o número de navegadores/threads diretamente aqui ---
        num_browsers = 1 # <<<<<<<< Altere este número para definir quantas instâncias você quer


        # --- Leitura do Arquivo de Entrada ---
        arquivo_entrada = 'template.csv' # Nome do arquivo de entrada (como no seu código original)

        if not os.path.exists(arquivo_entrada):
             print(f"Erro: Arquivo de entrada '{arquivo_entrada}' não encontrado.")
             sys.exit() # Encerra o script se o arquivo não existe

        try:
            df_initial = pd.read_csv(arquivo_entrada)

            if df_initial.empty:
                print("Arquivo template.csv está vazio. Nada para processar.")
                sys.exit() # Encerra o script se o arquivo está vazio

            # Obtém todos os itens para processar uma única vez no início
            all_items = df_initial.iloc[:, 0].tolist()
            total_processar = len(all_items) # Atualiza a variável global
            print(f"Total de valores para processar: {total_processar}")

            # Ajusta o número de threads se for maior que o número de itens
            if num_browsers > total_processar:
                print(f"Número de navegadores ({num_browsers}) é maior que o número de itens ({total_processar}). Usando {total_processar} navegadores.")
                num_browsers = total_processar
            # Garante pelo menos 1 navegador se houver itens, mesmo que num_browsers seja definido como 0 ou menos
            elif num_browsers <= 0 and total_processar > 0:
                 print(f"Número de navegadores ({num_browsers}) inválido. Usando 1 navegador.")
                 num_browsers = 1
            elif num_browsers <= 0 and total_processar == 0:
                 print("Não há itens para processar.")
                 sys.exit() # Sai se não houver itens e 0 navegadores solicitados


            # Cria instâncias dos locks (já declarados no início do script)
            # file_lock = threading.Lock() # Já declarado
            # counter_lock = threading.Lock() # Já declarado
            # monitor_stop_event = threading.Event() # Já declarado


            # Divide os itens em pedaços para cada thread
            # Usando numpy.array_split lida bem com divisões desiguais
            item_chunks = np.array_split(all_items, num_browsers)

            tempo_inicial = datetime.now()
            print("Começo da operação: ", tempo_inicial.strftime("%H:%M -- %d/%m"))

            threads = []
            # Cria e inicia os threads de processamento
            for i in range(num_browsers):
                # Converte o pedaço numpy array de volta para lista, e verifica se não está vazio
                chunk = item_chunks[i].tolist()
                if chunk:
                     # Cria a thread, passando a função thread_task como alvo
                     # Passa o thread_id (para o user data dir), o pedaço de itens, o tipo e os locks
                    thread = threading.Thread(target=thread_task,
                                              args=(i, chunk, item_type, file_lock, counter_lock),
                                              name=f"Browser-{i+1}") # Nomeia a thread
                    threads.append(thread)
                    thread.start() # Inicia a thread


            # Cria e inicia o thread de monitoramento APÓS os threads de processamento
            monitor_thread = threading.Thread(target=monitor_progresso, name="Monitor")
            monitor_thread.start()


            # Espera todos os threads de processamento completarem
            for thread in threads:
                thread.join()

            # Sinaliza para o thread de monitoramento parar e espera ele terminar
            monitor_stop_event.set() # Define o evento para sinalizar a parada
            monitor_thread.join() # Espera o thread de monitoramento terminar


            # --- Resumo Final (Executado após todas as threads terminarem) ---
            print("\n----------------------------------") # Pula uma linha após a linha final do monitoramento
            print("Processamento concluído.")
            print("----------------------------------")
            print("Começo da operação: ", tempo_inicial.strftime("%H:%M -- %d/%m"))

            tempo_final = datetime.now()
            print("Termino da operação: ", tempo_final.strftime("%H:%M -- %d/%m"))
            # Os contadores finais já foram atualizados pelo monitor_progresso antes de parar
            # Mas podemos imprimir novamente aqui para clareza no resumo final
            with counter_lock:
                 print(f"Total de itens processados: {processados}")
                 print(f"Total de erros: {erros}")
            print(f"Total de itens que estavam no template.csv no início: {total_processar}")


            tempo_total = tempo_final - tempo_inicial
            total_segundos = int(tempo_total.total_seconds())

            if total_segundos < 60:
                print(f"Tempo total da operação: {total_segundos} segundos")
            else:
                total_minutos = total_segundos // 60
                total_segundos_restantes = total_segundos % 60
                if total_minutos < 60:
                    print(f"Tempo total da operação: {total_minutos} minutos e {total_segundos_restantes} segundos")
                else:
                    total_horas = total_minutos // 60
                    total_minutos_restantes = total_minutos % 60
                    print(f"Tempo total da operação: {total_horas} horas e {total_minutos_restantes} minutos")

        except FileNotFoundError:
            # Esta exceção já é tratada pela verificação inicial, mas mantida por segurança
            print("Erro: Arquivo template.csv não encontrado.")
        except Exception as e:
            print(f"Ocorreu um erro no processo principal: {e}")
            traceback.print_exc(file=sys.stdout) # Imprime stacktrace no console