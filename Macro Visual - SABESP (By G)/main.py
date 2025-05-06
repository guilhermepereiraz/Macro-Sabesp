import eel
from MacroSITE_V4 import iniciar_macro_multi_thread
import sys
import mysql.connector # Importa o conector MySQL

eel.init('web')
# Credenciais fixas
DB_CONFIG = {
    'host': '10.51.109.123',
    'user': 'root', # **AVISO DE SEGURANÇA**: Não use 'root' em produção
    'password': 'SB28@sabesp', # **AVISO DE SEGURANÇA**: Não armazene a senha do DB diretamente no código
    'database': 'pendlist'
}


@eel.expose
def verificar_credenciais(email, senha_texto_claro):

    connection = None
    cursor = None
    usuario_identificador = None

    try:
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            print("Conexão com o banco de dados para login bem-sucedida!")
            cursor = connection.cursor(dictionary=True)

            # Busca o usuário pelo email e a senha (texto puro, INSEGURO!)
            # Ajuste o nome da coluna 'senha' se for diferente no seu banco
            sql_select = "SELECT id, nome, email, senha, cargo FROM tb_usuarios WHERE email = %s"
            cursor.execute(sql_select, (email,))
            usuario = cursor.fetchone()

            if usuario:
                stored_senha_no_banco = usuario['senha'] # Pega o valor armazenado (texto puro)

                # *** ESTE É O PONTO INSEGURO: COMPARAÇÃO DIRETA DA SENHA ***
                if senha_texto_claro == stored_senha_no_banco:
                    print("Login bem-sucedido (método inseguro)!")

                    # --- ADICIONADO: ATUALIZAÇÃO DO CAMPO ultimo_login ---
                    # Usamos o ID do usuário encontrado para garantir que atualizamos o registro correto
                    # CURRENT_TIMESTAMP() pega a data e hora atual do servidor do banco de dados
                    sql_update_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
                    cursor.execute(sql_update_login, (usuario['id'],))
                    connection.commit() # Confirma a transação para salvar a atualização

                    print(f"Campo ultimo_login atualizado para o usuário ID: {usuario['id']}")
                    # ----------------------------------------------------

                    # Retorna o identificador do usuário
                    usuario_identificador = usuario['nome'] if usuario.get('nome') else usuario['email']
                    return usuario_identificador
                else:
                    print("Falha no login: senha incorreta (método inseguro).")
                    return None # Senha incorreta

            else:
                print(f"Falha no login: Usuário com email '{email}' não encontrado (método inseguro).")
                return None # Usuário não encontrado

    except mysql.connector.Error as e:
        print(f"Erro do banco de dados durante o login ou atualização: {e}")
        if connection and connection.is_connected():
             connection.rollback() # Desfaz qualquer alteração pendente em caso de erro
        return None
    except Exception as e:
        print(f"Ocorreu um erro inesperado durante o login ou atualização: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            print("Conexão com o banco de dados para login fechada.")


@eel.expose
def iniciar_macro_eel(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario):

    print(f"Iniciando macro para usuário da aplicação '{identificador_usuario}'")
    print(f"Credenciais passadas para a macro (login site): {login_usuario}, {'*' * len(senha_usuario)}") # Não printar a senha real


    return iniciar_macro_multi_thread(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario)


def close_callback(page, old_addr, new_addr):
    print(f"Fechando: {page}, de {old_addr} para {new_addr}")
    if new_addr is None:
        print("Aplicação fechada pelo usuário.")
        sys.exit(0)  # Encerra o script Python

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


