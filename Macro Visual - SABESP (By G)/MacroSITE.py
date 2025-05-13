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
import pandas as pd
from selenium.common.exceptions import StaleElementReferenceException, NoSuchElementException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium import webdriver 
from datetime import datetime
import time
import os
import base64
import io
import eel
import logging

# Configura o logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

driver = None
wait = None
implicit_wait = None

#Funções

def reiniciarmacro(valor):
    global driver, wait
    if driver is None:
        logging.error("Driver não inicializado em reiniciarmacro. Não é possível continuar.")
        return {"status": "erro", "message": "Navegador não inicializado ao tentar reiniciar a macro."}

    logging.info("Iniciando reiniciarmacro para valor: %s", valor)
    xpath_principal = '//*[@id="box"]/div[3]/div/div/div/div/div[3]'
    xpath_alternativo = '//*[@id="box"]/div[3]/div/div/div/div/div[2]'

    logging.info("Pressionando F5 para reiniciar o navegador...")
    driver.refresh()
    WebDriverWait(driver, 30).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    logging.info("Página recarregada com sucesso.")

    driver.switch_to.default_content()
    logging.info("Alterando para o iframe principal...")
    wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))
    logging.info("Iframe carregado com sucesso!")

    logging.info("Tentando localizar 'nova instância'...")
    try:
        novainstanciaprincipal = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, xpath_principal))
        )
        novainstanciaprincipal.click()
        logging.info("Clicando em nova instância verde (principal).")
    except TimeoutException:
        logging.warning("Elemento principal não encontrado, tentando o alternativo...")
        try:
            novainstancia = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.XPATH, xpath_alternativo))
            )
            novainstancia.click()
            logging.info("Clicando em nova instância vermelha (alternativa).")
        except TimeoutException:
            logging.error("Nenhuma das opções foi encontrada. Reiniciando login...")
            driver.quit()
            return login()

        try:
            logging.info("Tentando clicar em 'planejamento'...")
            planejamento = WebDriverWait(driver, 60).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
            )
            planejamento.click()
            logging.info("Clique em 'planejamento' bem-sucedido.")

        except StaleElementReferenceException:
            logging.warning("Elemento 'planejamento' recriado no DOM. Recarregando a página...")
            driver.refresh()  # Recarrega o navegador
            WebDriverWait(driver, 30).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            driver.switch_to.default_content()
            wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))

        except TimeoutException:
            logging.error("Elemento 'planejamento' não encontrado dentro do limite de tempo. Reiniciando a macro...")

        try:
            logging.info("Tentando clicar em 'busca execução'...")
            busca_execucao = WebDriverWait(driver, 60).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
            busca_execucao.click()
            logging.info("Clique em 'busca execução' bem-sucedido.")

        except StaleElementReferenceException:
            logging.warning("Elemento 'busca execução' recriado no DOM. Recarregando a página...")
            driver.refresh()
            WebDriverWait(driver, 30).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            driver.switch_to.default_content()
            wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))

        except TimeoutException:
            logging.error("Elemento 'busca execução' não encontrado dentro do tempo limite. Reiniciando a macro...")

    logging.info("Reiniciando macro após reiniciarmacro para valor: %s", valor)
    return macro(valor)  # Retorna para a função macro para recomeçar o processamento


def carregar_arquivo(conteudo_base64, tipo_arquivo, colunas_esperadas):
    logging.info("Carregando arquivo do tipo: %s", tipo_arquivo)
    try:
        if tipo_arquivo == 'csv':
            logging.info("Decodificando arquivo CSV...")
            conteudo_decodificado = base64.b64decode(conteudo_base64).decode('utf-8')
            df = pd.read_csv(io.StringIO(conteudo_decodificado), sep=';', encoding='utf-8')
        elif tipo_arquivo == 'excel':
            logging.info("Decodificando arquivo Excel...")
            conteudo_decodificado = base64.b64decode(conteudo_base64)
            df = pd.read_excel(io.BytesIO(conteudo_decodificado))
        else:
            logging.error("Tipo de arquivo não suportado: %s", tipo_arquivo)
            return None

        if df.empty:
            logging.warning("O arquivo enviado está vazio.")
            return None

        logging.info("Verificando colunas esperadas...")
        dados_extraidos = {}
        for coluna in colunas_esperadas:
            if coluna in df.columns:
                logging.info("Coluna encontrada: %s", coluna)
                dados_extraidos[coluna] = df[coluna].tolist()
            else:
                logging.warning("Coluna '%s' não encontrada no arquivo.", coluna)
                dados_extraidos[coluna] = []  # Adiciona uma lista vazia para colunas ausentes

        logging.info("Dados extraídos: %s", dados_extraidos)
        return dados_extraidos
    except Exception as e:
        logging.error("Erro ao processar o arquivo enviado: %s", str(e))
        return None

def armazenar_dados_proc_final_thread(fornecimento, os_numero, status):
    logging.info("Armazenando dados de processamento final.")
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

# Atualiza a função login para usar credenciais fornecidas pelo frontend

def login(l_login, s_senha):
    logging.info("Iniciando login com usuário: %s", l_login)
    global driver, wait, implicit_wait

    try:
        # Clicar no campo de nome de usuário
        driver.switch_to.frame(driver.find_element(By.NAME, "mainFrame"))
        logging.info("Alterado para o iframe 'mainFrame'.")
        time.sleep(2)
        username_field = driver.find_element(By.CSS_SELECTOR, "input[id='USER']")  # Campo de usuário
        password_field = driver.find_element(By.CSS_SELECTOR, 'input[id="INPUTPASS"]')  # Campo de senha
        login_button = driver.find_element("id", "submbtn")  # Botão de login

        # Preencher os campos e enviar o formulário
        username_field.send_keys(l_login)
        password_field.send_keys(s_senha)
        login_button.click()
        logging.info("Credenciais enviadas e botão de login clicado.")

        time.sleep(2)

        planejamento = WebDriverWait(driver, 120).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
        )
        planejamento.click()
        logging.info("Planejamento clicado com sucesso.")

        busca_execucao = WebDriverWait(driver, 120).until(
            EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
        )
        busca_execucao.click()
        logging.info("Busca execução clicada com sucesso.")

    except Exception as e:
        logging.error("Erro ao realizar login: %s", str(e))
        return {"status": "erro", "message": "Erro ao realizar login."}

    return {"status": "sucesso", "message": "Login realizado com sucesso."}

# Expor a função login ao eel para receber credenciais do frontend
@eel.expose
def realizar_login(l_login, s_senha):
    logging.info("Recebendo solicitação de login do frontend.")
    return login(l_login, s_senha)

def macro(valor):
    global driver, wait
    logging.info("Iniciando macro para valor: %s", valor)
    if driver is None: # <-- ADICIONAR: Verificação se o driver existe antes de usá-lo
        logging.error("Driver não inicializado na função macro. Não é possível processar OS %s.", valor)
        return {"status": "erro", "message": f"Navegador não inicializado para a OS {valor}."}


    planejamento = WebDriverWait(driver, 5).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div/div[2]/div[6]'))
            )
    planejamento.click()

    busca_execucao = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
    busca_execucao.click()

    # ARRUMAR ESSA FUNCAO

    while True:
        try:
            logging.info("Alterando para o iframe principal e tentando localizar 'status_avaliacao'...")
            driver.switch_to.default_content()
            wait.until(EC.frame_to_be_available_and_switch_to_it((By.NAME, 'mainFrame')))
            status_avaliacao = WebDriverWait(driver, 20).until(EC.presence_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[9]/tr[1]/td/span'))
            )
            status_avaliacao.click()
            logging.info("Status de avaliação clicado com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro ao clicar em 'status_avaliacao': %s", str(e))
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao clicar em 'status_avaliacao' para OS {valor}: {str(e)}"}

    while True:
        try:
            com_resultado = WebDriverWait(driver, 20).until(EC.presence_of_element_located(
                (By.XPATH, '//select[@name="_lyXWFMRAGMSTATOINIVIO"]')))
            select_neta = Select(com_resultado)
            select_neta.select_by_index(2)
            logging.info("Resultado selecionado com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao selecionar resultado. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao selecionar resultado para OS {valor}: {str(e)}"}

    while True:
        try:
            dados_os = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[13]/tr[1]/td/span/img')))
            dados_os.click()
            logging.info("Dados OS clicados com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao clicar em dados OS. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao clicar em dados OS para OS {valor}: {str(e)}"}

    while True:
        try:
            numero_os = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[13]/tr[3]/td[2]/table/tbody/tr/td/input')))
            numero_os.click()
            numero_os.clear()
            numero_os.send_keys(str(valor))
            logging.info("Número OS preenchido com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao preencher número OS. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao preencher número OS para OS {valor}: {str(e)}"}              

    while True:
        try:
            contrato_x = WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[1]/tbody[3]/tr[11]/td[2]/table/tbody/tr/td[3]/img[2]')))
            driver.execute_script("arguments[0].click();", contrato_x)
            logging.info("Contrato X clicado com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao clicar em contrato X. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao clicar em contrato X para OS {valor}: {str(e)}"}

    while True:
        try:
            WebDriverWait(driver, 20).until(EC.invisibility_of_element_located((By.ID, "transpdiv-2")))
            botao_buscar = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[2]/div/div/div/div[1]/table/tbody/tr/td/div/div[2]/div/form/table[3]/tbody/tr/td/table/tbody/tr/td[3]/button')))
            botao_buscar.click()
            logging.info("Botão buscar clicado com sucesso.")
            break  # sair do loop se a ação for bem-sucedida
        except (TimeoutException, StaleElementReferenceException, ElementClickInterceptedException) as e:
            logging.warning("Erro encontrado ao clicar em botão buscar. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao clicar em botão buscar para OS {valor}: {str(e)}"}

    while True:
        try:
            linhas_laranja = WebDriverWait(driver, 20).until(EC.visibility_of_element_located(
                (By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/div[3]/div[2]/div/div/div/table/tbody/tr[2]/td[1]/div[1]/div/div/img')))
            linhas_laranja.click()
            logging.info("Linhas laranja clicadas com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao clicar em linhas laranja. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao clicar em linhas laranja para OS {valor}: {str(e)}"}

    while True: 
        try:
            resultado_intervencao = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Resultado Intervenção')]"))
            )
            resultado_intervencao.click()
            logging.info("Resultado intervenção clicado com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao clicar em resultado intervenção. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao clicar em resultado intervenção para OS {valor}: {str(e)}"}

    str_status_site = None
    while True:
        try:
            select_element = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.XPATH, "//select[@name='_lyXSABARODID_XDABLPDE']"))
            )
            if select_element.is_displayed():
                str_status_site = select_element.text
            logging.info("Status site obtido com sucesso.")
            break 
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao obter status site. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao obter status site para OS {valor}: {str(e)}"}
        
    while True:
        try:
            dados_client = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[1]/td/div/div[1]/div[2]"))
            )
            dados_client.click()
            logging.info("dados cliente clicado.")
            break 
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao obter status site. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao obter status site para OS {valor}: {str(e)}"}

    fornecimento_wfm = None
    while True:
        try:
            forn_usuario = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.XPATH, '/html/body/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[1]/td/div/div[2]/div[2]/div/div[1]/table/tbody/tr/td[1]/table/tbody/tr/td')))

            if forn_usuario.is_displayed():
                fornecimento_wfm = forn_usuario.text
            logging.info("Fornecimento WFM obtido com sucesso.")
            break 
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao obter fornecimento WFM. Tentando novamente...")
            reiniciarmacro(valor)  # Voltar para reiniciarmacro em caso de erro
            return {"status": "erro", "message": f"Erro ao obter fornecimento WFM para OS {valor}: {str(e)}"}

    while True:
        try:
            botao_fecha = WebDriverWait(driver, 30).until(EC.visibility_of_element_located((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[3]/div[2]/div[6]')))
            driver.execute_script("arguments[0].click();", botao_fecha)
            logging.info("Botão fechar clicado com sucesso.")
            break 
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao clicar em botão fechar. Tentando novamente...")
            continue  # Tenta novamente sem retornar erro

    while True:
        try:
            busca_execucao = WebDriverWait(driver, 30).until(
                EC.element_to_be_clickable((By.XPATH, '/html/body/div[1]/div/table/tbody/tr[3]/td/div/div/table/tbody/tr[1]/td/div[2]/div[2]/div[2]'))
            )
            busca_execucao.click()
            logging.info("Busca execução clicada com sucesso.")
            break
        except (TimeoutException, StaleElementReferenceException) as e:
            logging.warning("Erro encontrado ao clicar em busca execução. Tentando novamente...")
            continue  # Tenta novamente sem retornar erro
        except Exception as e:
            logging.error("Erro inesperado ao clicar em busca execução: %s", str(e))
            return {"status": "erro", "message": f"Erro inesperado ao clicar em busca execução para OS {valor}: {str(e)}"}


    armazenar_dados_proc_final_thread(fornecimento_wfm, valor, str_status_site)

    logging.info("Macro finalizada com sucesso para valor: %s", valor)
    return {"status": "sucesso", "fornecimento": fornecimento_wfm, "os": valor, "site_status": str_status_site}


# Expor uma nova função ao eel para iniciar a macro
@eel.expose
def iniciar_macro(conteudo_base64, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo):
    global driver, wait
    logging.info("Recebendo solicitação para iniciar a macro do frontend...")

    colunas_esperadas = ['Numero OS', 'Número OS', 'NUMERO OS', 'OS', 'os']

    logging.info("Carregando arquivo...")
    dados_extraidos = carregar_arquivo(conteudo_base64, tipo_arquivo, colunas_esperadas)
    if dados_extraidos is None:
        logging.error("Erro ao carregar o arquivo enviado ou colunas ausentes.")
        if 'eel' in globals() and hasattr(eel, 'display_macro_error_frontend'):
             try:
                 eel.display_macro_error_frontend("Erro ao carregar o arquivo ou colunas necessárias ausentes.")
             except Exception as e:
                 logging.error(f"Falha ao enviar erro ao frontend: {e}")
        if driver:
            try:
                driver.quit()
            except Exception as e:
                logging.warning(f"Erro ao fechar driver após erro no carregamento do arquivo: {e}")
            driver = None
        return {"status": "erro", "message": "Erro ao carregar o arquivo enviado ou colunas ausentes."}


    lista_os = None
    for col in colunas_esperadas:
        if col in dados_extraidos and dados_extraidos[col]:
            lista_os = [str(os_val).strip() for os_val in dados_extraidos[col] if pd.notna(os_val) and str(os_val).strip()]
            break

    if lista_os is None or not lista_os:
         logging.error("Nenhuma coluna de OS válida encontrada no arquivo ou lista de OS vazia.")
         if 'eel' in globals() and hasattr(eel, 'display_macro_error_frontend'):
             try:
                 eel.display_macro_error_frontend("Nenhuma coluna com 'OS' ou 'Número OS' encontrada no arquivo ou a lista de OS está vazia.")
             except Exception as e:
                 logging.error(f"Falha ao enviar erro ao frontend: {e}")
         if driver:
             try:
                 driver.quit()
             except Exception as e:
                 logging.warning(f"Erro ao fechar driver após erro na lista de OS: {e}")
             driver = None
         return {"status": "erro", "message": "Nenhuma coluna de OS encontrada no arquivo ou a lista está vazia."}


    total_processar = len(lista_os)
    logging.info(f"Total de OS para processar: {total_processar}")

    try:
        logging.info("Configurando e iniciando o navegador para execução do Selenium...")
        options = Options()
        options.add_argument("--disable-gpu")
        options.add_argument("--start-maximized")
        # options.add_argument("--headless") # Deixa o navegador invisivel
        # options.add_argument("--disable-gpu") # Deixa o navegador invisivel

        if driver is not None:
            logging.warning("Instância do navegador existente detectada antes de iniciar uma nova macro. Fechando.")
            try:
                driver.quit()
            except Exception as e:
                logging.error(f"Erro ao tentar fechar instância de navegador existente: {e}")
            driver = None

        driver = webdriver.ChromiumEdge(options=options)
        wait = WebDriverWait(driver, 30)

        logging.info("Navegador iniciado com sucesso.")

        driver.get('https://geoprd.sabesp.com.br/sabespwfm/')
        logging.info("URL carregada: https://geoprd.sabesp.com.br/sabespwfm/")
        driver.maximize_window()

        logging.info("Chamando a função login para realizar as interações de login no site.")
        login_result = login(login_usuario, senha_usuario)

        if login_result.get("status") != "sucesso":
             logging.error("Falha no login no site WFM. Não é possível iniciar a macro.")
             if driver:
                 try:
                     driver.quit()
                 except Exception as e:
                      logging.warning(f"Erro ao fechar driver após falha no login: {e}")
             driver = None
             return login_result

        logging.info("Login no site WFM realizado com sucesso pela função login. Prosseguindo com a macro.")

    except Exception as e:
        logging.error(f"Erro CRÍTICO durante a inicialização do driver ou login no WFM: {e}", exc_info=True)
        if 'eel' in globals() and hasattr(eel, 'display_macro_error_frontend'):
             try:
                 eel.display_macro_error_frontend(f"Erro crítico ao iniciar o navegador ou fazer login: {e}")
             except Exception as ee:
                 logging.error(f"Falha ao enviar erro crítico para o frontend: {ee}")
        if driver:
            try:
                driver.quit()
            except Exception as e:
                 logging.warning(f"Erro ao fechar driver após erro crítico: {e}")
        driver = None
        return {"status": "erro", "message": "Erro crítico ao iniciar o navegador ou fazer login."}

    tempo_inicial = datetime.now()
    logging.info("Começo da operação: %s", tempo_inicial.strftime("%H:%M -- %d/%m"))
    if 'eel' in globals() and hasattr(eel, 'display_macro_processing_status_frontend'):
         try:
             eel.display_macro_processing_status_frontend("Iniciando processamento...", 0, total_processar)
         except Exception as e:
              logging.error(f"Falha ao enviar status inicial para o frontend: {e}")

    for idx, id_os in enumerate(lista_os):
        str_id_os = str(id_os)
        logging.info("Iniciando processamento da OS %s (%d/%d)", str_id_os, idx + 1, total_processar)

        if 'eel' in globals() and hasattr(eel, 'atualizar_status_os'):
            try:
                eel.atualizar_status_os(str_id_os, idx + 1, total_processar, "Processando", f"Processando: {str_id_os}")
            except Exception as e:
                 logging.error(f"Falha ao enviar status da OS {str_id_os} para o frontend: {e}")

        try:
            resultado_macro_os = macro(str_id_os)

            if resultado_macro_os.get("status") == "erro":
                 logging.error(f"A função macro reportou um erro para a OS {str_id_os}: {resultado_macro_os.get('message')}")
                 if 'eel' in globals() and hasattr(eel, 'atualizar_status_os'):
                     try:
                         eel.atualizar_status_os(str_id_os, idx + 1, total_processar, "Erro", f"Erro na OS {str_id_os}: {resultado_macro_os.get('message', 'Desconhecido')}")
                     except Exception as e:
                         logging.error(f"Falha ao enviar status de erro da OS {str_id_os} para o frontend: {e}")
                 continue
            else:
                 logging.info(f"OS {str_id_os} processada com sucesso pela função macro.")
                 if 'eel' in globals() and hasattr(eel, 'atualizar_status_os'):
                     try:
                         eel.atualizar_status_os(str_id_os, idx + 1, total_processar, "Sucesso", f"OS {str_id_os} Concluída")
                     except Exception as e:
                         logging.error(f"Falha ao enviar status de sucesso da OS {str_id_os} para o frontend: {e}")

        except Exception as e:
            logging.error(f"Erro CRÍTICO INESPERADO ao processar a OS {str_id_os}: {e}", exc_info=True)
            if 'eel' in globals() and hasattr(eel, 'atualizar_status_os'):
                try:
                    eel.atualizar_status_os(str_id_os, idx + 1, total_processar, "CRÍTICO", f"Erro CRÍTICO na OS {str_id_os}: {e}")
                except Exception as ee:
                    logging.error(f"Falha ao enviar status de erro CRÍTICO da OS {str_id_os} para o frontend: {ee}")
            break

        restantes = total_processar - (idx + 1)
        logging.info("Valores restantes para processar: %d", restantes)

        if 'eel' in globals() and hasattr(eel, 'atualizar_tempo_restante_js'):
             try:
                 tempo_decorrido_segundos = (datetime.now() - tempo_inicial).total_seconds()
                 os_processadas = idx + 1
                 if os_processadas > 0:
                     tempo_por_os = tempo_decorrido_segundos / os_processadas
                     tempo_restante_segundos = tempo_por_os * restantes
                     horas_restantes = int(tempo_restante_segundos // 3600)
                     minutos_restantes = int((tempo_restante_segundos % 3600) // 60)
                     segundos_restantes = int(tempo_restante_segundos % 60)
                     tempo_restante_formatado = f"{horas_restantes:02d}:{minutos_restantes:02d}:{segundos_restantes:02d}"
                     eel.atualizar_tempo_restante_js(tempo_restante_formatado)
                 else:
                     eel.atualizar_tempo_restante_js("Calculando...")
             except Exception as e:
                  logging.error(f"Falha ao calcular ou enviar tempo restante para o frontend: {e}")

    logging.info("Loop de processamento de OS finalizado.")

    logging.info("----------------------------------")
    logging.info("Operação realizada com sucesso (Loop de OS concluído)")
    logging.info("----------------------------------")

    logging.info("----------------------------------")
    logging.info("Começo da operação: %s", tempo_inicial.strftime("%H:%M -- %d/%m"))

    tempo_final = datetime.now()
    logging.info("Termino da operação: %s", tempo_final.strftime("%H:%M -- %d/%m"))
    logging.info("Total de OS processadas (%d)", total_processar)

    tempo_total = tempo_final - tempo_inicial
    total_segundos = int(tempo_total.total_seconds())
    if total_segundos < 60:
        logging.info("Tempo total da operação: %d segundos", total_segundos)
    else:
        total_minutos = total_segundos // 60
        total_segundos_restantes = total_segundos % 60
        if total_minutos < 60:
            logging.info("Tempo total da operação: %d minutos e %d segundos", total_minutos, total_segundos_restantes)
        else:
            total_horas = total_minutos // 60
            total_minutos_restantes = total_minutos % 60
            logging.info("Tempo total da operação: %d horas e %d minutos", total_horas, total_minutos_restantes)

    if driver:
        try:
            driver.quit()
            logging.info("Navegador fechado ao final do processamento.")
        except Exception as e:
            logging.warning(f"Não foi possível fechar o navegador ao final do processamento: {e}")
        driver = None

    if 'eel' in globals() and hasattr(eel, 'display_macro_completion_frontend'):
        try:
            eel.display_macro_completion_frontend("Processamento da macro concluído com sucesso!")
        except Exception as e:
            logging.error(f"Falha ao enviar mensagem de conclusão para o frontend: {e}")

    return {"status": "sucesso", "message": "Processamento da macro concluído."}