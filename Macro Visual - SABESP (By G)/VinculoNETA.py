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


def login_neta(l_login, s_senha):
    global driver, waint, implicit_wait
    prefs = {"profile.default_content_setting_values.notifications": 2}
    options = Options()
    options.add_argument("--headless") 
    options.add_argument("--disable-gpu") 
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--ignore-ssl-errors')

    driver = webdriver.ChromiumEdge(options=options)
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
        print(f"Erro ao interagir com a janela de autenticação: {str(e)}")

def extracao_de_dados():
    nome_wfmm = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "/html/body/form/div[5]/div[1]/table/tbody/tr/td[2]/span[1]"))
    ).text

    nome = nome_wfmm.upper()  # Nome sempre maiúsculo
    print(nome)

    perfil_wfm = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "/html/body/form/div[5]/div[1]/table/tbody/tr/td[2]/span[2]"))
    ).text

    perfil = perfil_wfm.title()  # Todas as palavras com a primeira letra maiúscula
    print(perfil)

    return {"nome": nome, "perfil": perfil}

