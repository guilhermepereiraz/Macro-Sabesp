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

def login_vectora(t_costumer, t_login, t_senha):
    global driver, wait, implicit_wait
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


    driver.get('http://10.7.41.190/vectorasys/')
    driver.maximize_window()

    try:
            time.sleep(2)
            costumer_field = driver.find_element(By.XPATH, "/html/body/div/form/table/tbody/tr[1]/td[2]/input")  # Altere "costumer" para o ID correto do campo de cliente
            username_field = driver.find_element(By.XPATH, "/html/body/div/form/table/tbody/tr[2]/td[2]/input")  # Altere "username" para o ID correto do campo de usuário
            password_field = driver.find_element(By.XPATH, "/html/body/div/form/table/tbody/tr[3]/td[2]/input[1]")  # Altere "password" para o ID correto do campo de senha
            login_button = driver.find_element(By.XPATH, "/html/body/div/form/table/tbody/tr[4]/td/button")  # Altere "login-button" para o ID correto do botão de login

            # Preencher os campos e enviar o formulário
            costumer_field.send_keys(t_costumer)
            username_field.send_keys(t_login)
            password_field.send_keys(t_senha)
            login_button.click()
            time.sleep(2)

            pn_usuarios = WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div[1]/div[2]/div/ul/li[6]/a"))
            )
            pn_usuarios.click()

            inpt_usuarios = WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div[1]/div[3]/div[2]/div/div/div[1]/div[2]/input"))
            )
            inpt_usuarios.clear()
            inpt_usuarios.send_keys(t_login)

            extracao_de_dados_result = extracao_de_dados()
            return extracao_de_dados_result  

    except Exception as e:
        logging.error(f"Erro ao interagir com a janela de autenticação VECTORA: {str(e)}")
        return {'nome': '', 'perfil': ''}

def extracao_de_dados():
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By

    nome_vectora = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "//html/body/div[1]/div[3]/div[2]/div/div/table/tbody/tr/td[1]"))
    ).text 
    nome = nome_vectora.upper()  # Todas as palavras com a primeira letra maiúscula
    logging.info(f"Nome VECTORA extraído: {nome}")

    perfil_vectora = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "/html/body/div[1]/div[3]/div[2]/div/div/table/tbody/tr/td[2]"))
    ).text

    perfil = perfil_vectora # Todas as palavras com a primeira letra maiúscula
    logging.info(f"Perfil VECTORA extraído: {perfil}")

    driver.quit()  # Fecha o navegador após a extração dos dados
    return {"nome": nome, "perfil": perfil}
