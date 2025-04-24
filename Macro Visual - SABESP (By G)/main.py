import eel
import io
from MacroSITE_V4 import iniciar_macro_com_arquivo

eel.init('web')

# Credenciais fixas 
USUARIOS = [
    {"identificador": "Administrador", "email": "adm", "senha": "adm"},
    {"identificador": "Jefferson", "email": "Jmsantos.eficien@gmail.com", "senha": "adm"},
    {"identificador": "Usuário Principal", "email": "usuario@exemplo.com", "senha": "senha123"},
]

@eel.expose
def verificar_credenciais(email, senha):
    for usuario in USUARIOS:
        if usuario["email"] == email and usuario["senha"] == senha:
            return usuario["identificador"]  # Retorna o identificador
    return None  # Retorna None em caso de falha

@eel.expose
def iniciar_macro_eel(conteudo_csv, login_usuario, senha_usuario):
    """
    Esta função é exposta ao Eel e chama a função iniciar_macro_com_arquivo
    do arquivo macrosite_v4.py, passando as credenciais.
    """
    return iniciar_macro_com_arquivo(conteudo_csv, login_usuario, senha_usuario)


def close_callback(page, old_addr, new_addr):
    print(f"Fechando: {page}, de {old_addr} para {new_addr}")
    if new_addr is None:
        print("Aplicação fechada pelo usuário.")
        # Aqui você pode adicionar lógica para encerrar seu backend Python, se necessário
        # Por exemplo:
        # import sys
        # sys.exit(0)

try:
    eel.start('login.html', size=(1280, 720), close_callback=close_callback)
except EnvironmentError as e:
    if 'eSpeak' in str(e):
        print("Erro: eSpeak não encontrado. Certifique-se de que está instalado.")
    elif 'No suitable GUI backend found.' in str(e):
        print("Erro: Nenhum backend de GUI adequado encontrado. Certifique-se de ter um navegador instalado (Chrome, Edge, etc.).")
    else:
        raise e
except Exception as e:
    print(f"Ocorreu um erro ao iniciar o Eel: {e}")
    
    
    