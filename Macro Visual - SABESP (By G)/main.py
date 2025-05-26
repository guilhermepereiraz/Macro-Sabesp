import eel
from MacroSITE import iniciar_macro
import sys
import pymysql # USANDO PyMySQL
import logging # Para o logging
import traceback # Para capturar o traceback
import hashlib
import pymysql.cursors
import random
import smtplib
from email.mime.text import MIMEText
import tkinter as tk
from Consulta_GeraL_Final import iniciar_macro_consulta_geral

# Detecta o tamanho da tela
root = tk.Tk()
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()
root.destroy()

# --- Configuração de Logging ---
log_format = '%(asctime)s - %(levelname)s - %(threadName)s - %(message)s'
# log_file = 'main_log.txt' # Nome do arquivo de log para o main.py

logging.basicConfig(level=logging.INFO,
                    format=log_format,
                    # filename=log_file, # <-- Descomente para logar para arquivo na pasta dist
                    filemode='w',
                    # force=True # Pode ser útil para reconfigurar o logging em ambientes complexos
                    )

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter(log_format)
console_handler.setFormatter(formatter)
if not any(isinstance(handler, logging.StreamHandler) for handler in logging.getLogger('').handlers):
    logging.getLogger('').addHandler(console_handler)
# --- Fim da Configuração de Logging ---

logging.info("--- main.py Iniciado ---")


DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root', # **AVISO DE SEGURANÇA**: Não use 'root' em produção
    'password': '12kk12kk', # **AVISO de SEGURANÇA**: Não armazene senha diretamente
    'database': 'pendilist'
}

EMAIL_CONFIG = {                
    'remetente_email': 'guilherme.spereira42@senacsp.edu.br',
    'remetente_senha': '26122514ms',
    'servidor_smtp': 'smtp-mail.outlook.com',
    'porta_smtp': 587
}


eel.init('web') 

@eel.expose
def enviar_email_cadastro_automatico(dados_cadastro, destinatario_fixo):
    """
    Recebe os dados do formulário de cadastro do Javascript e envia DOIS emails automáticos:
    1. Para o destinatário fixo com detalhes.
    2. Para o email do usuário com confirmação.

    Args:
        dados_cadastro (dict): Um dicionário com os dados do formulário (cargo, nome, emailUsuario, matricula, concordoTermos).
        destinatario_fixo (str): O endereço de email fixo para onde enviar os detalhes.

    Returns:
        dict: Um dicionário com 'sucesso' (bool), 'mensagem' (str) e 'numeroChamado' (int/str).
    """
    logging.info(f"Recebida solicitação de envio de dois emails automáticos.")
    logging.info(f"Dados do formulário: {dados_cadastro}")
    logging.info(f"Destinatário fixo para detalhes: {destinatario_fixo}")
    logging.info(f"Email do usuário para confirmação: {dados_cadastro.get('emailUsuario', 'Não informado')}")


    remetente_email = EMAIL_CONFIG['remetente_email']
    remetente_senha = EMAIL_CONFIG['remetente_senha']

    erros = [] # Lista para registrar erros de envio (se houver)
    numero_chamado_gerado = None # Inicializa o número do chamado

    try:
        # Opcional: Gerar um número de chamado real aqui (ou obter de onde for gerado)
        # Este número será usado em ambos os emails.
        numero_chamado_gerado = "JLG" + str(random.randint(10000, 99999))
        logging.info(f"Número de chamado gerado: {numero_chamado_gerado}")

        # --- ENVIO PARA O DESTINATÁRIO FIXO (DETALHES) ---
        logging.info(f"Preparando email de detalhes para {destinatario_fixo}")
        assunto_detalhes = f"Nova Solicitação de Cadastro - Chamado #{numero_chamado_gerado}"
        corpo_detalhes = f"""Prezado(a) Responsável pelo Cadastro,

Uma nova solicitação de cadastro de usuário foi recebida e registrada sob o Número de Chamado: {numero_chamado_gerado}.

Detalhes da Solicitação:

Nome Completo: {dados_cadastro.get('nome', 'Não informado')}
Cargo: {dados_cadastro.get('cargo', 'Não informado')}
E-mail de Contato do Usuário: {dados_cadastro.get('emailUsuario', 'Não informado')}
Número de Matrícula: {dados_cadastro.get('matricula', 'Não informado')}

Confirmação de Termos da Licença: {'Sim' if dados_cadastro.get('concordoTermos', False) else 'Não'}

Por favor, proceda com a análise e processamento desta solicitação.

Atenciosamente,

Sistema de Cadastro Automático
"""
        # Bloco try/except para o primeiro email (detalhes)
        try:
            # Cria e envia a mensagem de detalhes
            msg_detalhes = MIMEText(corpo_detalhes)
            msg_detalhes['Subject'] = assunto_detalhes
            msg_detalhes['From'] = remetente_email
            msg_detalhes['To'] = destinatario_fixo

            # Conecta, loga e envia
            server = smtplib.SMTP(EMAIL_CONFIG['servidor_smtp'], EMAIL_CONFIG['porta_smtp'])
            server.starttls() # Inicia TLS para porta 587
            # server = smtplib.SMTP_SSL(EMAIL_CONFIG['servidor_smtp'], 465) # Use esta linha para SSL (porta 465)
            server.login(remetente_email, remetente_senha)
            server.sendmail(remetente_email, destinatario_fixo, msg_detalhes.as_string())
            server.quit()
            logging.info(f"Email de detalhes enviado com sucesso para {destinatario_fixo}")

        except Exception as e:
            logging.error(f"Falha ao enviar email de detalhes para {destinatario_fixo}: {e}")
            erros.append(f"Falha ao enviar email de detalhes: {e}")


        # --- ENVIO PARA O USUÁRIO (CONFIRMAÇÃO) ---
        email_usuario = dados_cadastro.get('emailUsuario')
        if email_usuario: # Verifica se o email do usuário foi fornecido
            logging.info(f"Preparando email de confirmação para {email_usuario}")
            assunto_confirmacao = f"Confirmação de Solicitação de Cadastro - Chamado #{numero_chamado_gerado}"
            corpo_confirmacao = f"""Prezado(a) {dados_cadastro.get('nome', 'Usuário(a)')},

Sua solicitação de cadastro foi recebida com sucesso.

Um chamado foi criado com o número: {numero_chamado_gerado}

Analisaremos seus dados e entraremos em contato em breve com as próximas etapas.

Agradecemos seu interesse.

Atenciosamente,

Equipe de Cadastro [Sabesp|Macro JGL]
"""
            # Bloco try/except para o segundo email (confirmação para o usuário)
            try:
                # Cria e envia a mensagem de confirmação
                msg_confirmacao = MIMEText(corpo_confirmacao)
                msg_confirmacao['Subject'] = assunto_confirmacao
                msg_confirmacao['From'] = remetente_email # O remetente continua sendo o mesmo
                msg_confirmacao['To'] = email_usuario # O destinatário é o email do usuário

                # É uma boa prática fechar a conexão anterior antes de abrir uma nova,
                # ou reutilizar a conexão se possível. Aqui estamos abrindo uma nova para clareza.
                server = smtplib.SMTP(EMAIL_CONFIG['servidor_smtp'], EMAIL_CONFIG['porta_smtp'])
                server.starttls() # Inicia TLS para porta 587
                # server = smtplib.SMTP_SSL(EMAIL_CONFIG['servidor_smtp'], 465) # Use esta linha para SSL (porta 465)
                server.login(remetente_email, remetente_senha)
                server.sendmail(remetente_email, email_usuario, msg_confirmacao.as_string()) # Envia para o usuário
                server.quit()
                logging.info(f"Email de confirmação enviado com sucesso para o usuário {email_usuario}")

            except Exception as e:
                logging.error(f"Falha ao enviar email de confirmação para {email_usuario}: {e}")
                erros.append(f"Falha ao enviar email de confirmação para o usuário: {e}")
        else:
            logging.warning("Email do usuário não fornecido nos dados. Não foi possível enviar email de confirmação para o usuário.")
            erros.append("Email do usuário não fornecido para envio de confirmação.")


        # --- RESULTADO FINAL RETORNADO PARA O JAVASCRIPT ---
        if not erros:
            # Tudo OK se nenhum erro foi registrado
            mensagem_final = 'Solicitação processada e emails enviados com sucesso.'
            sucesso_geral = True
        else:
            # Houve erros em um ou ambos os envios de email
            mensagem_final = 'Solicitação processada, mas houve erros no envio de emails: ' + '; '.join(erros)
            sucesso_geral = False # Considera como falha geral se qualquer envio de email falhar

        return {'sucesso': sucesso_geral, 'mensagem': mensagem_final, 'numeroChamado': numero_chamado_gerado}

    except Exception as e:
        # Este bloco captura erros que ocorrem ANTES OU FORA das tentativas individuais de envio,
        # por exemplo, na geração do numero_chamado_gerado ou outros erros inesperados.
        logging.error(f"Erro inesperado na função enviar_email_cadastro_automatico: {e}")
        logging.exception("Detalhes do erro inesperado na função enviar_email_cadastro_automatico:")
        # Retorna erro para o JavaScript
        return {'sucesso': False, 'mensagem': f'Erro interno ao processar solicitação: {e}', 'numeroChamado': numero_chamado_gerado} # Retorna número gerado se disponível
# <<< FIM DA FUNÇÃO PARA ENVIAR DOIS EMAILS AUTOMÁTICOS >>>


@eel.expose
def get_username_by_id(user_id):
    connection = None
    cursor = None
    logging.info(f"Tentativa de obter nome do usuário para o ID: {user_id}")
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        cursor = connection.cursor()
        # Seleciona a coluna 'nome'
        sql = "SELECT nome FROM tb_usuarios WHERE id = %s"
        cursor.execute(sql, (user_id,))
        usuario = cursor.fetchone() # Pega a primeira linha

        if usuario:
            # Retorna o valor da coluna 'nome'
            logging.info(f"Nome '{usuario.get('nome')}' encontrado para o ID: {user_id}")
            return {"status": "success", "username": usuario.get('nome')}
        else:
            logging.warning(f"Usuário com ID '{user_id}' não encontrado.")
            return {"status": "user_not_found"}

    except pymysql.Error as e:
        logging.error(f"Erro DB ao obter nome por ID: {e}")
        logging.exception("Detalhes do erro DB ao obter nome por ID:")
        return {"status": "db_error"}
    except Exception as e:
        logging.error(f"Ocorreu um erro interno ao obter nome por ID: {e}")
        logging.exception("Detalhes do erro interno ao obter nome por ID:")
        return {"status": "internal_error"}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
# >>> FIM DA NOVA FUNÇÃO <<<

@eel.expose
def alterar_senha_primeiro_login(user_id, senha_atual, nova_senha): # Recebe os 3 argumentos do JS
    connection = None
    cursor = None
    logging.info(f"Tentativa de alterar senha para o usuário ID: {user_id}")
    print("--> Função alterar_senha_primeiro_login chamada no Python!") # Adicionado print para depuração

    try:
        # Adicionado print antes da conexão (identado 4 espaços)
        print("--> Tentando conectar ao banco de dados...")
        # Conexão com o banco (identado 4 espaços)
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        print("--> Conexão com o banco bem-sucedida.") # Adicionado print após conexão (identado 4 espaços)
        # Criação do cursor (identado 4 espaços)
        cursor = connection.cursor()
        print("--> Cursor criado.") # Adicionado print após cursor (identado 4 espaços)

        # --- Opcional: Verificação da Senha Atual (se seu fluxo exigir) ---
        # Adicionado print antes da primeira query (identado 4 espaços)
        print(f"--> Executando query para verificar senha atual para user_id: {user_id}")
        # Query de seleção (identado 4 espaços)
        sql_check_password = "SELECT senha FROM tb_usuarios WHERE id = %s"
        cursor.execute(sql_check_password, (user_id,))
        print("--> Query de verificação de senha executada.") # Adicionado print após query (identado 4 espaços)
        # Fetch one row (identado 4 espaços)
        user_data = cursor.fetchone()
        print(f"--> Dados do usuário obtidos: {user_data}") # Adicionado print com dados (identado 4 espaços)

        # ATENÇÃO: Comparação de senha em texto puro é INSEGURA! Use HASHES!
        # Início do bloco if (alinhado com try, identado 4 espaços)
        if user_data and user_data.get('senha') == senha_atual: # Verificação INSEGURA em texto puro
            # Código dentro do if (identado 8 espaços)
            print("--> Senha atual corresponde.") # Adicionado print
            logging.info(f"Senha atual verificada para o usuário ID: {user_id}")

            # --- Atualizar a Senha ---
            # ATENÇÃO: Armazenamento de senha em texto puro é INSEGURO! Use HASHES!
            # Código dentro do if (indentado 8 espaços)
            print(f"--> Executando query para atualizar senha para user_id: {user_id}")
            sql_update_password = "UPDATE tb_usuarios SET senha = %s WHERE id = %s"
            cursor.execute(sql_update_password, (nova_senha, user_id))
            print("--> Query de atualização de senha executada.") # Adicionado print


            # --- ADICIONAR: Atualizar ultimo_login APÓS alteração de senha ---
            print(f"--> Atualizando ultimo_login para o usuário ID: {user_id}")
            sql_update_last_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
            cursor.execute(sql_update_last_login, (user_id,))
            print("--> Query de atualização de ultimo_login executada.")
            # --- FIM DA ADIÇÃO ---


            connection.commit()
            print("--> Commit realizado.") # Adicionado print
            logging.info(f"Senha e ultimo_login atualizados com sucesso para o usuário ID: {user_id}")

            # Opcional: Limpar um flag de "primeiro login" se você tiver um campo dedicado para isso

            print("--> Retornando status 'success'") # Adicionado print antes do return (identado 8 espaços)
            return {"status": "success"} # Indica sucesso

        # Início do bloco else (alinhado com o if, indentado 4 espaços)
        else:
            # Código dentro do else (indentado 8 espaços)
            print("--> Senha atual não corresponde ou usuário não encontrado.") # Adicionado print
            logging.warning(f"Falha ao alterar senha para o usuário ID: {user_id}. Senha atual incorreta.")
            print("--> Retornando status 'incorrect_current_password'") # Adicionado print antes do return (identado 8 espaços)
            return {"status": "incorrect_current_password"} # Indica que a senha atual não coincide

    # Início do bloco except pymysql.Error (alinhado com o try, indentado 4 espaços)
    except pymysql.Error as e:
        # Código dentro do except (indentado 8 espaços)
        print(f"--> Capturado Erro PyMySQL: {e}") # Adicionado print no except
        logging.error(f"Erro do banco de dados durante alteração de senha: {e}")
        logging.exception("Detalhes do erro do banco de dados durante alteração de senha:")
        # Início do bloco if dentro do except (identado 12 espaços)
        if connection:
            # Código dentro do if (indentado 16 espaços)
            connection.rollback()
            print("--> Rollback realizado.") # Adicionado print
        # Código dentro do except (indentado 8 espaços)
        print("--> Retornando status 'db_error'") # Adicionado print antes do return
        return {"status": "db_error"} # Indica erro no banco

    # Início do bloco except Exception (alinhado com o try, indentado 4 espaços)
    except Exception as e:
        # Código dentro do except (indentado 8 espaços)
        print(f"--> Capturado Erro Geral: {e}") # Adicionado print no except
        logging.error(f"Ocorreu um erro INESPERADO (alterar_senha_primeiro_login): Tipo={type(e)}, Mensagem='{e}'")
        logging.exception("Detalhes do erro INESPERADO durante alteração de senha:")
        # Início do bloco if dentro do except (indentado 12 espaços)
        if connection:
            # Código dentro do if (indentado 16 espaços)
            connection.rollback()
            print("--> Rollback realizado.") # Adicionado print
        # Código dentro do except (indentado 8 espaços)
        print("--> Retornando status 'internal_error'") # Adicionado print antes do return
        return {"status": "internal_error"} # Indica erro interno inesperado

    # Início do bloco finally (alinhado com o try, indentado 4 espaços)
    finally:
        # Código dentro do finally (indentado 8 espaços)
        print("--> Bloco finally sendo executado.") # Adicionado print no finally
        # Início do bloco if dentro do finally (identado 12 espaços)
        if cursor:
            # Código dentro do if (indentado 16 espaços)
            print("--> Fechando cursor.") # Adicionado print
            cursor.close()
        # Início do bloco if dentro do finally (indentado 12 espaços)
        if connection:
            # Código dentro do if (indentado 16 espaços)
            print("--> Fechando conexão.") # Adicionado print
            connection.close()
            logging.info("Conexão com o banco de dados fechada (alterar_senha_primeiro_login).")

    # Esta é a linha cuja identação estava incorreta na versão anterior.
    # Ela deve estar alinhada com try, except, finally (identado 4 espaços, igual ao início do bloco try)
    print("--> Fim da função alterar_senha_primeiro_login.")


@eel.expose
def verificar_credenciais(email, senha_texto_claro):

    connection = None
    cursor = None

    logging.info(f"Tentativa de login para o email: {email}")

    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

        if connection:
            logging.info("Conexão com o banco de dados para login bem-sucedida!")

            cursor = connection.cursor()

            # Seleciona id, nome, email, senha, e ultimo_login
            sql = "SELECT id, nome, email, senha, ultimo_login FROM tb_usuarios WHERE email = %s"
            cursor.execute(sql, (email,))

            usuario = cursor.fetchone()

            if usuario:
                stored_senha_no_banco = usuario.get('senha')

                # --- Lógica de Verificação de Senha EM TEXTO PURO (INSEGURO) ---
                if senha_texto_claro == stored_senha_no_banco:
                    logging.info(f"Login bem-sucedido (texto claro) para: {email}")

                    # Verifica o valor de ultimo_login ANTES de atualizar
                    ultimo_login_anterior = usuario.get('ultimo_login')
                    logging.info(f"Valor de ultimo_login anterior para {email}: {ultimo_login_anterior}")


                    # Retorna um valor diferente com base na verificação ANTERIOR do ultimo_login
                    # Se ultimo_login_anterior for None, é o primeiro login
                    if ultimo_login_anterior is None:
                        logging.info(f"Primeiro login detectado para: {email}")
                        # *** NÃO ATUALIZA ultimo_login AQUI PARA O PRIMEIRO LOGIN ***
                        # Retorna status 'first_login' e o ID do usuário
                        return {"status": "first_login", "identifier": usuario.get('id')}
                    else:
                        # Se ultimo_login_anterior NÃO for None, é um login subsequente
                        logging.info(f"Login subsequente detectado para: {email}")

                        # --- ATUALIZAÇÃO DO CAMPO ultimo_login SOMENTE PARA LOGIN SUBSEQUENTE ---
                        sql_update_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
                        cursor.execute(sql_update_login, (usuario.get('id'),))
                        connection.commit()
                        logging.info(f"Campo ultimo_login atualizado para o usuário ID: {usuario.get('id')}")
                        # ----------------------------------------------------

                        # Retorna status 'success' e o nome do usuário
                        return {"status": "success", "identifier": usuario.get('nome')}

                else:
                    logging.warning(f"Falha de login: Senha incorreta (texto claro) para: {email}")
                    return {"status": "incorrect_password"}

            else:
                logging.warning(f"Falha de login: Usuário com email '{email}' não encontrado.")
                return {"status": "user_not_found"}

    except pymysql.Error as e:
        logging.error(f"Erro do banco de dados (PyMySQL) durante o login: {e}")
        logging.exception("Detalhes do erro do banco de dados (PyMySQL) durante o login:")
        if connection:
            connection.rollback()
        return {"status": "db_error"}

    except Exception as e:
        logging.error(f"Ocorreu um erro INESPERADO (verificar_credenciais): Tipo={type(e)}, Mensagem='{e}'")
        logging.exception("Detalhes do erro INESPERADO (verificar_credenciais):")
        if connection:
            connection.rollback()
        return {"status": "internal_error"}

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            logging.info("Conexão com o banco de dados para login fechada.")


@eel.expose
def iniciar_macro_eel(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario):
    """
    Função exposta ao Eel para iniciar a macro principal (Macro SITE).
    Agora chama a nova função `iniciar_macro` do MacroSITE.py.
    """
    logging.info(f"Chamada para iniciar macro para usuário da aplicação '{identificador_usuario}'")
    logging.info(f"Credenciais passadas para a macro (login site): {login_usuario}, {'*' * len(senha_usuario)}")
    logging.info(f"Nome do arquivo: {nome_arquivo}, Tipo: {tipo_arquivo}")

    # Chama a nova função iniciar_macro do MacroSITE.py
    from MacroSITE import iniciar_macro

    try:
        logging.info("Chamando a função iniciar_macro do MacroSITE.py...")
        resultado = iniciar_macro(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo)
        logging.info("Macro iniciada com sucesso. Resultado: %s", resultado)
        return resultado
    except Exception as e:
        logging.error(f"Erro ao iniciar a macro: {e}")
        logging.exception("Detalhes do erro ao iniciar a macro:")
        return {"status": "erro", "message": "Erro ao iniciar a macro."}



@eel.expose
def iniciar_macro_consulta_geral_frontend(conteudo_base64, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_pesquisa, nome_usuario=None):
    logging.info(f"Chamada para iniciar macro Consulta Geral para '{tipo_pesquisa.upper()}'")
    
    try:
        if not nome_usuario:
            logging.warning("Nome do usuário não fornecido")
            nome_usuario = "Usuário não identificado"
            
        logging.info(f"Nome do usuário: {nome_usuario}")
        
        if tipo_pesquisa.lower() not in ['pde', 'hidro']:
            logging.error(f"Tipo de pesquisa inválido: {tipo_pesquisa}")
            return {"status": "erro", "message": "Tipo de pesquisa deve ser 'pde' ou 'hidro'"}
            
        # Passa o nome_usuario como identificador
        return iniciar_macro_consulta_geral(
            conteudo_base64, 
            login_usuario, 
            senha_usuario, 
            nome_arquivo, 
            tipo_arquivo, 
            tipo_pesquisa,
            identificador=nome_usuario
        )
    except Exception as e:
        logging.error(f"Erro ao iniciar a macro Consulta Geral: {e}")
        logging.exception("Detalhes do erro ao iniciar a macro Consulta Geral:")
        return {"status": "erro", "message": "Erro ao iniciar a macro Consulta Geral."}


@eel.expose
def salvar_nova_senha(senha_atual, nova_senha):
    """
    Atualiza a senha do usuário no banco de dados.
    """
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            # Verifica se a senha atual está correta
            sql_check_password = "SELECT id FROM tb_usuarios WHERE senha = %s"
            cursor.execute(sql_check_password, (senha_atual,))
            usuario = cursor.fetchone()

            if not usuario:
                return {"status": "erro", "message": "Senha atual incorreta."}

            # Atualiza a senha no banco de dados
            sql_update_password = "UPDATE tb_usuarios SET senha = %s WHERE id = %s"
            cursor.execute(sql_update_password, (nova_senha, usuario['id']))
            connection.commit()

            return {"status": "sucesso", "message": "Senha alterada com sucesso."}
    except Exception as e:
        logging.error(f"Erro ao atualizar a senha: {e}")
        return {"status": "erro", "message": "Erro ao atualizar a senha."}


@eel.expose
def atualizar_ultimo_login():
    """
    Atualiza o campo ultimo_login para o usuário atual no banco de dados.
    """
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            # Atualiza o campo ultimo_login para o usuário atual
            sql_update_last_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
            user_id = eel.session.get('user_id')  # Obtém o ID do usuário da sessão
            cursor.execute(sql_update_last_login, (user_id,))
            connection.commit()
            logging.info(f"Campo ultimo_login atualizado para o usuário ID: {user_id}")
            return {"status": "sucesso"}
    except Exception as e:
        logging.error(f"Erro ao atualizar o campo ultimo_login: {e}")
        return {"status": "erro", "message": "Erro ao atualizar o campo ultimo_login."}


def close_callback(page, sockets):
    logging.info(f"Conexão websocket fechada para a página: {page}. Sockets restantes: {len(sockets)}")

    # Verifica se a página relevante para a macro ainda está aberta
    if page == "macroSITE.html" and not sockets:
        logging.info("Última conexão websocket fechada para macroSITE.html. Sinalizando para parar a macro e encerrando processo Python.")
        try:
            from MacroSITE import parar_macro_event
            parar_macro_event.set()  # Sinaliza o evento de parada global
        except Exception as e:
            logging.error(f"Erro ao sinalizar parada da macro: {e}")
    else:
        logging.info("Conexões WebSocket ainda ativas ou página irrelevante para a macro.")


try: # 0 espaços
    logging.info("--- Iniciando Aplicação Eel ---") # 4 espaços
    # Altere o modo para 'chrome' para abrir no navegador padrão em uma nova aba
    eel.start('login.html', mode='chrome', size=(screen_width, screen_height), close_callback=close_callback) # 4 espaços

    # Esta linha só será atingida se eel.start não for 'blocking=True' (comportamento padrão)
    logging.info("Chamada eel.start retornou.") # 4 espaços

except EnvironmentError as e: # 0 espaços
    # Captura erros relacionados ao ambiente, como navegador não encontrado pelo Eel
    logging.error(f"Erro de ambiente ao iniciar EEL: {e}") # 4 espaços
    logging.exception("Detalhes do erro de ambiente ao iniciar EEL:") # 4 espaços
    sys.exit(1) # Sair com código de erro se houver EnvironmentError (4 espaços)

except Exception as e: # 0 espaços
    # Captura outros erros inesperados durante a inicialização do Eel
    logging.error(f"Erro geral ao iniciar EEL: {e}") # 4 espaços
    logging.exception("Detalhes do erro geral ao iniciar EEL:") # 4 espaços
    sys.exit(1) # Sair com código de erro se houver outro erro na inicialização (4 espaços)

logging.info("--- Saindo da Aplicação ---") # 0 espaços
