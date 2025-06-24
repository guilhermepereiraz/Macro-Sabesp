from time import sleep

def login(l_login, s_senha):
    global driver, waint, implicit_wait
    from selenium.webdriver.edge.options import Options
    from selenium import webdriver
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, ElementClickInterceptedException
    import time

    prefs = {"profile.default_content_setting_values.notifications": 2}
    options = Options()
    options.add_argument("--headless") 
    options.add_argument("--disable-gpu") 
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--ignore-ssl-errors')

    driver = webdriver.ChromiumEdge(options=options)
    wait = WebDriverWait(driver, 30)

    driver.get('https://geoprd.sabesp.com.br/sabespwfm/')
    driver.maximize_window()

    try:
        driver.switch_to.frame(driver.find_element(By.NAME, "mainFrame"))
        time.sleep(2)
        username_field = driver.find_element(By.CSS_SELECTOR, "input[id='USER']")
        password_field = driver.find_element(By.CSS_SELECTOR, 'input[id="INPUTPASS"]')
        login_button = driver.find_element("id", "submbtn")
        # Preencher os campos e enviar o formulário
        username_field.send_keys(l_login)
        password_field.send_keys(s_senha)
        login_button.click()
        time.sleep(2)
        extracao_de_dados_result = extracao_de_dados()
        return extracao_de_dados_result  # Deve retornar {'nome': ..., 'perfil': ...}
    except Exception as e:
        print(f"Erro ao interagir com a janela de autenticação: {str(e)}")

def extracao_de_dados():
    global driver,waint,implicit_wait
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By
    import time
    try:
        cliclar_no_perfil = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.XPATH, "/html/body/div[1]/div/table/tbody/tr[2]/td/div/div[1]/div[2]")))
        cliclar_no_perfil = driver.execute_script("arguments[0].click();", cliclar_no_perfil)
        time.sleep(1) 
        i_de_informacao = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.XPATH, "/html/body/div[1]/div/table/tbody/tr[2]/td/div/div[2]/div/div[3]")))
        i_de_informacao.click()
        time.sleep(1)  # Aguarda o carregamento da janela de informações
        nome_do_perfil = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.XPATH, "/html/body/div[3]/div[2]/div[2]/div/div[2]/div[1]/div/div[2]"))).text
        texto = nome_do_perfil  # "HENRIQUE VIEIRA\nMARCIO"
        nomes = texto.split('\n')
        nomes.reverse()
        nome = nomes
        perfil_wfm = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.XPATH, "/html/body/div[3]/div[2]/div[2]/div/div[2]/div[2]/div[1]/div[1]/div/div[2]"))).text

        perfil = perfil_wfm.replace("Perfil WFM:", "").strip()

        if isinstance(nome, list):
            nome = ' '.join(nome)

        print(f"Nome: {nome}, Perfil: {perfil}")
        driver.quit()  # Fecha o navegador após a extração dos dados
        return {'nome': nome, 'perfil': perfil}
    except Exception as e:
        print(f"Erro ao interagir com a janela de autenticação: {str(e)}")
        return {'nome': '', 'perfil': ''}

