from dateutil.relativedelta import relativedelta
import sys
import os
import logging

# Função para obter o caminho correto do driver quando compilado
def get_driver_path():
    if getattr(sys, 'frozen', False):
        # Rodando como um executável PyInstaller
        return os.path.join(sys._MEIPASS, 'msedgedriver.exe')
    # Rodando como script normal
    return 'msedgedriver.exe'


def login_neta(l_login, s_senha):
    global driver, waint, implicit_wait
    from selenium.webdriver.edge.options import Options
    from selenium.webdriver.edge.service import Service
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

    service = Service(executable_path=get_driver_path())
    driver = webdriver.ChromiumEdge(service=service, options=options)
    wait = WebDriverWait(driver, 30)

    driver.get('https://conecta.sabesp.com.br/NETAinf/login.aspx')
    driver.maximize_window()

    try:
        time.sleep(2)
        username_field = driver.find_element(By.ID, "extended_login_Username")  # Altere "username" para o ID correto do campo de usuário
        password_field = driver.find_element(By.ID, "extended_login_Password")  # Altere "password" para o ID correto do campo de senha
        login_button = driver.find_element(By.ID, "extended_login_Login")  # Altere "login-button" para o ID correto do botão de login
            
        # Preencher os campos e enviar o formulário
        username_field.send_keys(l_login)
        password_field.send_keys(s_senha)
        login_button.click()
        time.sleep(2)

        extracao_de_dados_result = extracao_de_dados()
        return extracao_de_dados_result  

    except Exception as e:
        logging.error(f"Erro ao interagir com a janela de autenticação NETA: {str(e)}")
        return {'nome': '', 'perfil': ''}

def extracao_de_dados():
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By

    nome_wfmm = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "/html/body/form/div[5]/div[1]/table/tbody/tr/td[2]/span[1]"))
    ).text

    nome = nome_wfmm.upper()  # Nome sempre maiúsculo
    logging.info(f"Nome NETA extraído: {nome}")

    perfil_wfm = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "/html/body/form/div[5]/div[1]/table/tbody/tr/td[2]/span[2]"))
    ).text

    perfil = perfil_wfm.title()  # Todas as palavras com a primeira letra maiúscula
    logging.info(f"Perfil NETA extraído: {perfil}")

    driver.quit()  # Fecha o navegador após a extração dos dados
    return {"nome": nome, "perfil": perfil}
