import os
import sys
import ctypes
import eel
import psutil
import tkinter as tk
from tkinter import messagebox
from MacroSITE import iniciar_macro
import pymysql
import logging
import random
import smtplib
from email.mime.text import MIMEText
import base64
from VinculoWFM import login
from VinculoNETA import login_neta
from VinculoVECTORA import login_vectora
import multiprocessing
import threading
from Consulta_GeraL_Final import open_results_folder

# Adicionado para compatibilidade com PyInstaller em Windows
multiprocessing.freeze_support()


log_format = '%(asctime)s - %(levelname)s - %(threadName)s - %(message)s'
logging.basicConfig(level=logging.INFO,
                    format=log_format,
                    filemode='w',
                    )

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter(log_format)
console_handler.setFormatter(formatter)
if not any(isinstance(handler, logging.StreamHandler) for handler in logging.getLogger('').handlers):
    logging.getLogger('').addHandler(console_handler)

logging.info("--- main.py Iniciado ---")


# Configurações do banco de dados e email

DB_CONFIG = {
    'host': '10.51.109.123',
    'user': 'root', # **AVISO DE SEGURANÇA**: Não use 'root' em produção
    'password': 'SB28@sabesp', # **AVISO de SEGURANÇA**: Não armazene senha diretamente
    'database': 'pendlist'
}

EMAIL_CONFIG = {                
    'remetente_email': 'guilherme.spereira42@senacsp.edu.br',
    'remetente_senha': '26122514ms',
    'servidor_smtp': 'smtp-mail.outlook.com',
    'porta_smtp': 587
}

# Definir screen_width e screen_height antes de qualquer uso
import ctypes
user32 = None
screen_width = 1200
screen_height = 800
try:
    user32 = ctypes.windll.user32
    screen_width = user32.GetSystemMetrics(0)
    screen_height = user32.GetSystemMetrics(1)
except Exception as e:
    logging.warning(f"Não foi possível obter a resolução da tela, usando valores padrão. Erro: {e}")

eel.init('web') 

#Função Para verificar se já existe uma instância do aplicativo em execução

def verificar_instancia_unica():
    """
    Verifica se já existe outra instância do aplicativo em execução.
    Funciona tanto no ambiente de desenvolvimento (script Python) quanto
    no aplicativo compilado (.exe).
    """
    # Importações dentro da função para manter o escopo limpo
    import psutil
    import os
    import sys
    import ctypes

    current_pid = os.getpid()
    is_frozen = getattr(sys, 'frozen', False)

    # O caminho do script/executável atual é a referência mais confiável.
    current_path = os.path.abspath(sys.argv[0]).lower()

    instance_found = False
    for proc in psutil.process_iter(['pid', 'name', 'exe', 'cmdline']):
        try:
            # Pula o processo atual
            if proc.info['pid'] == current_pid:
                continue

            if is_frozen:
                # Se for um app compilado, compara o caminho do executável.
                if proc.info['exe'] and os.path.abspath(proc.info['exe']).lower() == current_path:
                    instance_found = True
                    break
            else:
                # Se for um script, verifica se outro processo python está executando o mesmo script.
                cmdline = proc.info['cmdline']
                if cmdline and len(cmdline) > 1 and os.path.abspath(cmdline[1]).lower() == current_path:
                    instance_found = True
                    break
        except (psutil.NoSuchProcess, psutil.AccessDenied, Exception):
            continue

    if instance_found:
        print("Já existe uma instância do aplicativo em execução. Fechando...")
        # Exibe uma caixa de mensagem de aviso (0x30 = MB_ICONWARNING)
        ctypes.windll.user32.MessageBoxW(0, "Já existe uma aba do aplicativo em execução.", "Aviso", 0x30)
        sys.exit(0)


# Função para enviar uma solicitação de cadastro automatico por email 

@eel.expose
def enviar_email_cadastro_automatico(dados_cadastro, destinatario_fixo):
    logging.info(f"Recebida solicitação de envio de dois emails automáticos.")
    logging.info(f"Dados do formulário: {dados_cadastro}")
    logging.info(f"Destinatário fixo para detalhes: {destinatario_fixo}")
    logging.info(f"Email do usuário para confirmação: {dados_cadastro.get('emailUsuario', 'Não informado')}")

    remetente_email = EMAIL_CONFIG['remetente_email']
    remetente_senha = EMAIL_CONFIG['remetente_senha']

    erros = []
    numero_chamado_gerado = None

    try:
        numero_chamado_gerado = "JLG" + str(random.randint(10000, 99999))
        logging.info(f"Número de chamado gerado: {numero_chamado_gerado}")

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
        try:
            msg_detalhes = MIMEText(corpo_detalhes)
            msg_detalhes['Subject'] = assunto_detalhes
            msg_detalhes['From'] = remetente_email
            msg_detalhes['To'] = destinatario_fixo

            server = smtplib.SMTP(EMAIL_CONFIG['servidor_smtp'], EMAIL_CONFIG['porta_smtp'])
            server.starttls()
            server.login(remetente_email, remetente_senha)  # <--- CORRIGIDO: logi  n antes do sendmail
            server.sendmail(remetente_email, destinatario_fixo, msg_detalhes.as_string())
            server.quit()
            logging.info(f"Email de detalhes enviado com sucesso para {destinatario_fixo}")

        except Exception as e:
            logging.error(f"Falha ao enviar email de detalhes para {destinatario_fixo}: {e}")
            erros.append(f"Falha ao enviar email de detalhes: {e}")

        email_usuario = dados_cadastro.get('emailUsuario')
        if email_usuario:
            logging.info(f"Preparando email de confirmação para {email_usuario}")
            assunto_confirmacao = f"Confirmação de Solicitação de Cadastro - Chamado #{numero_chamado_gerado}"
            corpo_confirmacao = f"""Prezado(a) {dados_cadastro.get('nome', 'Usuário(a)')},
\nSua solicitação de cadastro foi recebida com sucesso.\n\nUm chamado foi criado com o número: {numero_chamado_gerado}\n\nAnalisaremos seus dados e entraremos em contato em breve com as próximas etapas.\n\nAgradecemos seu interesse.\n\nAtenciosamente, Equipe de Cadastro [Sabesp|Macro JGL]\n"""
            try:
                msg_confirmacao = MIMEText(corpo_confirmacao)
                msg_confirmacao['Subject'] = assunto_confirmacao
                msg_confirmacao['From'] = remetente_email
                msg_confirmacao['To'] = email_usuario

                server = smtplib.SMTP(EMAIL_CONFIG['servidor_smtp'], EMAIL_CONFIG['porta_smtp'])
                server.starttls()
                server.login(remetente_email, remetente_senha)
                server.sendmail(remetente_email, email_usuario, msg_confirmacao.as_string())
                server.quit()
                logging.info(f"Email de confirmação enviado com sucesso para o usuário {email_usuario}")

            except Exception as e:
                logging.error(f"Falha ao enviar email de confirmação para {email_usuario}: {e}")
                erros.append(f"Falha ao enviar email de confirmação para o usuário: {e}")
        else:
            logging.warning("Email do usuário não fornecido nos dados. Não foi possível enviar email de confirmação para o usuário.")
            erros.append("Email do usuário não fornecido para envio de confirmação.")

        if not erros:
            mensagem_final = 'Solicitação processada e emails enviados com sucesso.'
            sucesso_geral = True
        else:
            mensagem_final = 'Solicitação processada, mas houve erros no envio de emails: ' + '; '.join(erros)
            sucesso_geral = False

        return {'sucesso': sucesso_geral, 'mensagem': mensagem_final, 'numeroChamado': numero_chamado_gerado}

    except Exception as e:
        logging.error(f"Erro inesperado na função enviar_email_cadastro_automatico: {e}")
        logging.exception("Detalhes do erro inesperado na função enviar_email_cadastro_automatico:")
        return {'sucesso': False, 'mensagem': f'Erro interno ao processar solicitação: {e}', 'numeroChamado': numero_chamado_gerado}


# Função para enviar sugestão|Melhorias de macro por email

@eel.expose
def enviar_email_sugestao(dados_sugestao, destinatario_fixo):
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders
    import base64
    logging.info(f"Recebida solicitação de envio de sugestão.")
    logging.info(f"Dados da sugestão: {dados_sugestao}")
    logging.info(f"Destinatário fixo: {destinatario_fixo}")

    remetente_email = EMAIL_CONFIG['remetente_email']
    remetente_senha = EMAIL_CONFIG['remetente_senha']

    try:
        corpo = (
            f"Nova sugestão recebida pelo sistema Macro JGL.\n\n"
            f"Tipo de Sugestão: {dados_sugestao.get('tipo', 'Não informado')}\n"
            f"Nome: {dados_sugestao.get('nome', 'Não informado')}\n"
            f"E-mail: {dados_sugestao.get('email', 'Não informado')}\n"
            f"Prioridade: {dados_sugestao.get('prioridade', 'Não informado')}\n"
            f"Data de Envio: {dados_sugestao.get('data_envio', '')}\n\n"
            
            # Detalhes específicos da aba 'nova-macro'
            f"--- Detalhes da Nova Macro ---\n"
            f"Título da Sugestão: {dados_sugestao.get('titulo_sugestao', 'N/A')}\n"
            f"Objetivo da Macro: {dados_sugestao.get('descricao_sugestao', 'N/A')}\n"
            f"Ambiente/Software: {dados_sugestao.get('ambiente_software', 'N/A')}\n"
            f"Processo Atual: {dados_sugestao.get('processo_atual', 'N/A')}\n"
            f"Processo Desejado: {dados_sugestao.get('processo_desejado', 'N/A')}\n\n"

            # Detalhes específicos da aba 'melhoria'
            f"--- Detalhes da Melhoria ---\n"
            f"Macro Existente: {dados_sugestao.get('macro_existente', 'N/A')}\n"
            f"Descrição da Melhoria: {dados_sugestao.get('descricao_melhoria', 'N/A')}\n"
        )

        msg = MIMEMultipart()
        msg['From'] = remetente_email
        msg['To'] = destinatario_fixo
        msg['Subject'] = f"Sugestão - {dados_sugestao.get('tipo', 'Macro JGL')}"
        msg.attach(MIMEText(corpo, 'plain'))

        anexos = dados_sugestao.get('anexos', [])
        for anexo in anexos:
            nome_arquivo = anexo.get('nome')
            conteudo_base64 = anexo.get('conteudo_base64')
            if nome_arquivo and conteudo_base64:
                try:
                    header, encoded = conteudo_base64.split(',', 1) if ',' in conteudo_base64 else ('', conteudo_base64)
                    file_data = base64.b64decode(encoded)
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(file_data)
                    encoders.encode_base64(part)
                    part.add_header('Content-Disposition', f'attachment; filename="{nome_arquivo}"')
                    msg.attach(part)
                except Exception as e:
                    logging.error(f"Erro ao anexar arquivo {nome_arquivo}: {e}")

        server = smtplib.SMTP(EMAIL_CONFIG['servidor_smtp'], EMAIL_CONFIG['porta_smtp'])
        server.starttls()
        server.login(remetente_email, remetente_senha)
        server.sendmail(remetente_email, destinatario_fixo, msg.as_string())
        server.quit()
        logging.info(f"Sugestão enviada com sucesso para {destinatario_fixo}")
        return {'sucesso': True, 'mensagem': 'Sugestão enviada com sucesso!'}
    except Exception as e:
        logging.error(f"Erro ao enviar sugestão: {e}")
        logging.exception("Detalhes do erro ao enviar sugestão:")
        return {'sucesso': False, 'mensagem': f'Erro ao enviar sugestão: {e}'}


# Função que verifica qual versão o usuario esta usando e compara com a versão do banco de dados

@eel.expose
def get_atualicao_app():
    logging.info("Buscando versão do aplicativo na tabela tb_versao.")
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            # A query busca a versão onde o ID é 1. Não é necessário passar user_id.
            sql = "SELECT versao FROM tb_versao WHERE id = 1"
            cursor.execute(sql) # Removido (user_id,)
            versao_data = cursor.fetchone() # Renomeado para refletir o que está sendo buscado

            if versao_data:
                logging.info(f"Versão encontrada: {versao_data.get('versao')}")
                return {
                    "status": "success",
                    "versao": versao_data.get("versao", "N/A") # Retorna a versão
                }
            else:
                logging.warning("Nenhuma versão encontrada na tabela tb_versao com ID = 1.")
                return {"status": "not_found", "message": "Versão do aplicativo não encontrada."}
    except Exception as e:
        logging.error(f"Erro ao buscar a versão do aplicativo no banco de dados: {e}")
        return {"status": "error", "message": f"Erro ao buscar versão: {e}"}
    finally:
        if connection:
            connection.close()
            logging.info("Conexão com o banco de dados fechada (get_atualicao_app).")


# Função paara obter o nome do usuário pelo ID

@eel.expose
def get_username_by_id(user_id):
    connection = None
    cursor = None
    logging.info(f"Tentativa de obter nome do usuário para o ID: {user_id}")
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        cursor = connection.cursor()
        sql = "SELECT nome FROM tb_usuarios WHERE id = %s"
        cursor.execute(sql, (user_id,))
        usuario = cursor.fetchone()

        if usuario:
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


# Função para alterar a senha do usuário no primeiro login

@eel.expose
def alterar_senha_primeiro_login(user_id, senha_atual, nova_senha):
    connection = None
    cursor = None
    logging.info(f"Tentativa de alterar senha para o usuário ID: {user_id}")
    print("--> Função alterar_senha_primeiro_login chamada no Python!")

    try:
        print("--> Tentando conectar ao banco de dados...")
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        print("--> Conexão com o banco bem-sucedida.")
        cursor = connection.cursor()
        print("--> Cursor criado.")

        print(f"--> Executando query para verificar senha atual para user_id: {user_id}")
        sql_check_password = "SELECT senha FROM tb_usuarios WHERE id = %s"
        cursor.execute(sql_check_password, (user_id,))
        print("--> Query de verificação de senha executada.")
        user_data = cursor.fetchone()
        print(f"--> Dados do usuário obtidos: {user_data}")

        if user_data and user_data.get('senha') == senha_atual:
            print("--> Senha atual corresponde.")
            logging.info(f"Senha atual verificada para o usuário ID: {user_id}")

            print(f"--> Executando query para atualizar senha para user_id: {user_id}")
            sql_update_password = "UPDATE tb_usuarios SET senha = %s WHERE id = %s"
            cursor.execute(sql_update_password, (nova_senha, user_id))
            print("--> Query de atualização de senha executada.")

            print(f"--> Atualizando ultimo_login  para o usuário ID: {user_id}")
            sql_update_last_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
            cursor.execute(sql_update_last_login, (user_id,))
            print("--> Query de atualização de ultimo_login executada.")

            connection.commit()
            print("--> Commit realizado.")
            logging.info(f"Senha e ultimo_login atualizados com sucesso para o usuário ID: {user_id}")

            print("--> Retornando status 'success'")
            return {"status": "success"}

        else:
            print("--> Senha atual não corresponde ou usuário não encontrado.")
            logging.warning(f"Falha ao alterar senha para o usuário ID: {user_id}. Senha atual incorreta.")
            print("--> Retornando status 'incorrect_current_password'")
            return {"status": "incorrect_current_password"}

    except pymysql.Error as e:
        print(f"--> Capturado Erro PyMySQL: {e}")
        logging.error(f"Erro do banco de dados durante alteração de senha: {e}")
        logging.exception("Detalhes do erro do banco de dados durante alteração de senha:")
        if connection:
            connection.rollback()
            print("--> Rollback realizado.")
        print("--> Retornando status 'db_error'")

    except Exception as e:
        print(f"--> Capturado Erro Geral: {e}")
        logging.error(f"Ocorreu um erro INESPERADO (alterar_senha_primeiro_login): Tipo={type(e)}, Mensagem='{e}'")
        logging.exception("Detalhes do erro INESPERADO durante alteração de senha:")
        if connection:
            connection.rollback()
            print("--> Rollback realizado.")
        print("--> Retornando status 'internal_error'")

    finally:
        print("--> Bloco finally sendo executado.")
        if cursor:
            print("--> Fechando cursor.")
            cursor.close()
        if connection:
            print("--> Fechando conexão.")
            connection.close()
            logging.info("Conexão com o banco de dados fechada (alterar_senha_primeiro_login).")

    print("--> Fim da função alterar_senha_primeiro_login.")


# Função para verificar as credenciais do usuário 

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

            sql = "SELECT id, nome, email, senha, ultimo_login FROM tb_usuarios WHERE email = %s"
            cursor.execute(sql, (email,))

            usuario = cursor.fetchone()

            if usuario:
                stored_senha_no_banco = usuario.get('senha')

                if senha_texto_claro == stored_senha_no_banco:
                    logging.info(f"Login bem-sucedido (texto claro) para: {email}")

                    ultimo_login_anterior = usuario.get('ultimo_login')
                    logging.info(f"Valor de ultimo_login anterior para {email}: {ultimo_login_anterior}")

                    if ultimo_login_anterior is None:
                        logging.info(f"Primeiro login detectado para: {email}")
                        return {"status": "first_login", "identifier": usuario.get('id')}
                    else:
                        logging.info(f"Login subsequente detectado para: {email}")

                        sql_update_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
                        cursor.execute(sql_update_login, (usuario.get('id'),))
                        connection.commit()
                        logging.info(f"Campo ultimo_login atualizado para o usuário ID: {usuario.get('id')}")
                        
                        return {"status": "success", "identifier": usuario.get('nome'), "user_id": usuario.get('id')}

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


# Função para vincular o usuário ao WFM

@eel.expose
def vincular_wfm(usuario_id, wfm_login, wfm_senha):
    logging.info(f"[vincular_wfm] Iniciando vínculo para usuario_id={usuario_id}, wfm_login={wfm_login}")
    resultado = login(wfm_login, wfm_senha)
    logging.info(f"[vincular_wfm] Resultado do Selenium: {resultado}")
    if not resultado or not resultado.get('nome') or not resultado.get('perfil'):
        logging.error("[vincular_wfm] Falha ao autenticar no WFM. Login ou senha inválidos, ou erro na extração.")
        return {"status": "error", "message": "Falha ao autenticar no WFM. Verifique login e senha."}

    wfm_nome = resultado.get('nome', '')
    wfm_perfil = resultado.get('perfil', '')
    logging.info(f"[vincular_wfm] Nome extraído: {wfm_nome} | Perfil extraído: {wfm_perfil}")

    connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with connection.cursor() as cursor:
            sql_check = "SELECT id FROM tb_vinculo_wfm WHERE usuario_id = %s"
            cursor.execute(sql_check, (usuario_id,))
            vinculo = cursor.fetchone()
            logging.info(f"[vincular_wfm] Já existe vínculo? {vinculo}")
            if vinculo:
                sql_update = "UPDATE tb_vinculo_wfm SET wfm_login=%s, wfm_senha=%s, wfm_nome=%s, wfm_perfil=%s, data_vinculo=NOW() WHERE usuario_id=%s"
                cursor.execute(sql_update, (wfm_login, wfm_senha, wfm_nome, wfm_perfil, usuario_id))
                logging.info(f"[vincular_wfm] Vínculo atualizado para usuario_id={usuario_id}")
            else:
                sql_insert = "INSERT INTO tb_vinculo_wfm (usuario_id, wfm_login, wfm_senha, wfm_nome, wfm_perfil) VALUES (%s, %s, %s, %s, %s)"
                cursor.execute(sql_insert, (usuario_id, wfm_login, wfm_senha, wfm_nome, wfm_perfil))
                logging.info(f"[vincular_wfm] Vínculo criado para usuario_id={usuario_id}")
            connection.commit()
            logging.info(f"[vincular_wfm] Commit realizado para usuario_id={usuario_id}")
        return {"status": "success"}
    except Exception as e:
        logging.error(f"[vincular_wfm] Erro ao salvar vínculo WFM: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
        logging.info(f"[vincular_wfm] Conexão com o banco fechada para usuario_id={usuario_id}")


# Função para vincular o usuário ao VECTORA 

@eel.expose
def vincular_vectora(usuario_id, vectora_costumer, vectora_login, vectora_senha):
    logging.info(f"[vincular_vectora] Iniciando vínculo para usuario_id={usuario_id}, wfm_login={vectora_login}")
    resultado = login_vectora(vectora_costumer, vectora_login, vectora_senha)
    logging.info(f"[vincular_vectora] Resultado do Selenium: {resultado}")
    if not resultado or not resultado.get('nome') or not resultado.get('perfil'):
        logging.error("[vincular_vectora] Falha ao autenticar no VECTORA. Login ou senha inválidos, ou erro na extração.")
        return {"status": "error", "message": "Falha ao autenticar no VECTORA. Verifique login e senha."}

    vectora_nome = resultado.get('nome', '')
    vectora_perfil = resultado.get('perfil', '')
    logging.info(f"[vincular_vectora] Nome extraído: {vectora_nome} | Perfil extraído: {vectora_perfil}")

    connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with connection.cursor() as cursor:
            sql_check = "SELECT id FROM tb_vinculo_vectora WHERE usuario_id = %s"
            cursor.execute(sql_check, (usuario_id,))
            vinculo = cursor.fetchone()
            logging.info(f"[vincular_vectora] Já existe vínculo? {vinculo}")
            if vinculo:
                sql_update = "UPDATE tb_vinculo_vectora SET vectora_costumer=%s, vectora_login=%s, vectora_senha=%s, vectora_nome=%s, vectora_perfil=%s, data_vinculo=NOW() WHERE usuario_id=%s"
                cursor.execute(sql_update, (vectora_costumer, vectora_login, vectora_senha, vectora_nome, vectora_perfil, usuario_id))
                logging.info(f"[vincular_vectora] Vínculo atualizado para usuario_id={usuario_id}")
            else:
                sql_insert = "INSERT INTO tb_vinculo_vectora (usuario_id, vectora_costumer, vectora_login, vectora_senha, vectora_nome, vectora_perfil) VALUES (%s, %s, %s, %s, %s, %s)"
                cursor.execute(sql_insert, (usuario_id, vectora_costumer, vectora_login, vectora_senha, vectora_nome, vectora_perfil))
                logging.info(f"[vincular_vectora] Vínculo criado para usuario_id={usuario_id}")
            connection.commit()
            logging.info(f"[vincular_vectora] Commit realizado para usuario_id={usuario_id}")
        return {"status": "success"}
    except Exception as e:
        logging.error(f"[vincular_vectora] Erro ao salvar vínculo VECTORA: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
        logging.info(f"[vincular_vecotra] Conexão com o banco fechada para usuario_id={usuario_id}")


# Função para vincular o usuário ao NETA

@eel.expose
def vincular_neta(usuario_id, neta_login, neta_senha):
    logging.info(f"[vincular_neta] Iniciando vínculo para usuario_id={usuario_id}, wfm_login={neta_login}")
    resultado = login_neta(neta_login, neta_senha)
    logging.info(f"[vincular_neta] Resultado do Selenium: {resultado}")
    if not resultado or not resultado.get('nome') or not resultado.get('perfil'):
        logging.error("[vincular_neta] Falha ao autenticar no NETA. Login ou senha inválidos, ou erro na extração.")
        return {"status": "error", "message": "Falha ao autenticar no NETA. Verifique login e senha."}

    neta_nome = resultado.get('nome', '')
    neta_perfil = resultado.get('perfil', '')
    logging.info(f"[vincular_wfm] Nome extraído: {neta_nome} | Perfil extraído: {neta_perfil}")

    connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with connection.cursor() as cursor:
            sql_check = "SELECT id FROM tb_vinculo_neta WHERE usuario_id = %s"
            cursor.execute(sql_check, (usuario_id,))
            vinculo = cursor.fetchone()
            logging.info(f"[vincular_neta] Já existe vínculo? {vinculo}")
            if vinculo:
                sql_update = "UPDATE tb_vinculo_neta SET neta_login=%s, neta_senha=%s, neta_nome=%s, neta_perfil=%s, data_vinculo=NOW() WHERE usuario_id=%s"
                cursor.execute(sql_update, (neta_login, neta_senha, neta_nome, neta_perfil, usuario_id))
                logging.info(f"[vincular_neta] Vínculo atualizado para usuario_id={usuario_id}")
            else:
                sql_insert = "INSERT INTO tb_vinculo_neta (usuario_id, neta_login, neta_senha, neta_nome, neta_perfil) VALUES (%s, %s, %s, %s, %s)"
                cursor.execute(sql_insert, (usuario_id, neta_login, neta_senha, neta_nome, neta_perfil))
                logging.info(f"[vincular_neta] Vínculo criado para usuario_id={usuario_id}")
            connection.commit()
            logging.info(f"[vincular_neta] Commit realizado para usuario_id={usuario_id}")
        return {"status": "success"}
    except Exception as e:
        logging.error(f"[vincular_neta] Erro ao salvar vínculo WFM: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
        logging.info(f"[vincular_neta] Conexão com o banco fechada para usuario_id={usuario_id}")


# Funções para obter os vínculos do usuário WFM

@eel.expose
def get_wfm_vinculo_by_user_id(user_id):
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            sql = "SELECT wfm_nome, wfm_perfil, wfm_login, wfm_senha FROM tb_vinculo_wfm WHERE usuario_id = %s"
            cursor.execute(sql, (user_id,))
            vinculo = cursor.fetchone()
            if vinculo:
                return {
                    "status": "success",
                    "wfm_nome": vinculo.get("wfm_nome", ""),
                    "wfm_perfil": vinculo.get("wfm_perfil", ""),
                    "wfm_login": vinculo.get("wfm_login", ""),
                    "wfm_senha": vinculo.get("wfm_senha", "")
                }
            else:
                return {"status": "not_found"}
    except Exception as e:
        logging.error(f"Erro ao buscar vínculo WFM: {e}")
        return {"status": "error", "message": str(e)}
    

# Funções para obter os vínculos do usuário NETA

@eel.expose
def get_neta_vinculo_by_user_id(user_id):
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            sql = "SELECT neta_nome, neta_perfil, neta_login, neta_senha FROM tb_vinculo_neta WHERE usuario_id = %s"
            cursor.execute(sql, (user_id,))
            vinculo = cursor.fetchone()
            if vinculo:
                return {
                    "status": "success",
                    "neta_nome": vinculo.get("neta_nome", ""),
                    "neta_perfil": vinculo.get("neta_perfil", ""),
                    "neta_login": vinculo.get("neta_login", ""),
                    "neta_senha": vinculo.get("neta_senha", "")
                }
            else:
                return {"status": "not_found"}
    except Exception as e:
        logging.error(f"Erro ao buscar vínculo NETA: {e}")
        return {"status": "error", "message": str(e)}


# Funções para obter os vínculos do usuário NETA

@eel.expose
def get_vectora_vinculo_by_user_id(user_id):
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            sql = "SELECT vectora_costumer, vectora_login, vectora_senha, vectora_nome, vectora_perfil FROM tb_vinculo_vectora WHERE usuario_id = %s"
            cursor.execute(sql, (user_id,))
            vinculo = cursor.fetchone()
            if vinculo:
                return {
                    "status": "success",
                    "vectora_costumer": vinculo.get("vectora_costumer", ""),
                    "vectora_login": vinculo.get("vectora_login", ""),
                    "vectora_senha": vinculo.get("vectora_senha", ""),
                    "vectora_nome": vinculo.get("vectora_nome", ""),
                    "vectora_perfil": vinculo.get("vectora_perfil", "")
                }
            else:
                return {"status": "not_found"}
    except Exception as e:
        logging.error(f"Erro ao buscar vínculo VECTORA: {e}")
        return {"status": "error", "message": str(e)}


# função para iniciar a macro do site WFM

@eel.expose
def iniciar_macro_eel(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario):
    logging.info(f"Chamada para iniciar macro para usuário da aplicação '{identificador_usuario}'")
    logging.info(f"Credenciais passadas para a macro (login site): {login_usuario}, {'*' * len(senha_usuario)}")
    logging.info(f"Nome do arquivo: {nome_arquivo}, Tipo: {tipo_arquivo}")

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
    

# Função para iniciar a macro de Deliberação VECTORA

@eel.expose
def iniciar_macro_deliberacaoo(costumer, login, senha, conteudo_base64, nome_arquivo, tipo_arquivo, identificador_usuario):
    logging.info(f"Chamada para iniciar macro para usuário da aplicação '{identificador_usuario}'")
    logging.info(f"Credenciais passadas para a macro (login site): {costumer}, {login}, {'*' * len(senha)}")
    logging.info(f"Nome do arquivo: {nome_arquivo}, Tipo: {tipo_arquivo}")

    from Deliberacao import iniciar_macro_deliberacao as deliberacao_macro

    try:
        logging.info("Chamando a função iniciar_macro_deliberacao do Deliberacao.py...")
        resultado = deliberacao_macro(costumer, login, senha, conteudo_base64, nome_arquivo, tipo_arquivo, identificador_usuario)
        logging.info("Macro Deliberação iniciada com sucesso. Resultado: %s", resultado)
        return resultado
    except Exception as e:
        logging.error(f"Erro ao iniciar a macro Deliberação: {e}")
        logging.exception("Detalhes do erro ao iniciar a macro Deliberação:")
        return {"status": "erro", "message": "Erro ao iniciar a macro Deliberação."}


# Função para iniciar a macro de Consulta Geral NETA

def macro_consulta_geral_worker(args, progress_queue):
    from Consulta_GeraL_Final import iniciar_macro_consulta_geral
    iniciar_macro_consulta_geral(*args, progress_queue=progress_queue)

def progress_listener(progress_queue):
    while True:
        try:
            data = progress_queue.get()
            if data == 'END':
                break
            eel.update_progress(data)
        except Exception as e:
            logging.error(f"Erro na thread de progresso: {e}")

@eel.expose
def iniciar_macro_consulta_geral_frontend(conteudo_base64, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_pesquisa, nome_usuario=None):
    import datetime
    logging.info(f"[DEBUG] Python: início da função iniciar_macro_consulta_geral_frontend, timestamp: {datetime.datetime.now().isoformat()}")
    logging.info(f"Chamada para iniciar macro Consulta Geral para '{tipo_pesquisa.upper()}'")
    try:
        if not nome_usuario:
            nome_usuario = "Usuário"
        logging.info(f"[DEBUG] Nome do usuário recebido: {nome_usuario}")

        if tipo_pesquisa.lower() not in ['pde', 'hidro']:
            logging.error(f"Tipo de pesquisa inválido: {tipo_pesquisa}")
            return {"status": "erro", "message": "Tipo de pesquisa deve ser 'pde' ou 'hidro'"}

        logging.info(f"[DEBUG] Antes de criar multiprocessing.Queue() - {datetime.datetime.now().isoformat()}")
        progress_queue = multiprocessing.Queue()
        logging.info(f"[DEBUG] multiprocessing.Queue() criado - {datetime.datetime.now().isoformat()}")
        args = (
            conteudo_base64,
            login_usuario,
            senha_usuario,
            nome_arquivo,
            tipo_arquivo,
            tipo_pesquisa,
            5,  # número de threads, ajuste se necessário
            nome_usuario
        )
        logging.info(f"[DEBUG] Antes de iniciar thread progress_listener - {datetime.datetime.now().isoformat()}")
        threading.Thread(target=progress_listener, args=(progress_queue,), daemon=True).start()
        logging.info(f"[DEBUG] Thread progress_listener iniciada - {datetime.datetime.now().isoformat()}")
        logging.info(f"[DEBUG] Antes de iniciar Process macro_consulta_geral_worker - {datetime.datetime.now().isoformat()}")
        p = multiprocessing.Process(target=macro_consulta_geral_worker, args=(args, progress_queue))
        p.start()
        logging.info(f"[DEBUG] Process macro_consulta_geral_worker iniciado - {datetime.datetime.now().isoformat()}")

        return {"status": "sucesso", "message": "Macro iniciada em background."}
    except Exception as e:
        logging.error(f"Erro ao iniciar a macro Consulta Geral: {e}")
        logging.exception("Detalhes do erro ao iniciar a macro Consulta Geral:")
        return {"status": "erro", "message": "Erro ao iniciar a macro Consulta Geral."}


# Função para salvar uma nova senha

@eel.expose
def salvar_nova_senha(senha_atual, nova_senha):
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            sql_check_password = "SELECT id FROM tb_usuarios WHERE senha = %s"
            cursor.execute(sql_check_password, (senha_atual,))
            usuario = cursor.fetchone()

            if not usuario:
                return {"status": "erro", "message": "Senha atual incorreta."}

            sql_update_password = "UPDATE tb_usuarios SET senha = %s WHERE id = %s"
            cursor.execute(sql_update_password, (nova_senha, usuario['id']))
            connection.commit()

            return {"status": "sucesso", "message": "Senha alterada com sucesso."}
    except Exception as e:
        logging.error(f"Erro ao atualizar a senha: {e}")
        return {"status": "erro", "message": "Erro ao atualizar a senha."}


# Função para atualizar o campo ultimo_login do usuário

@eel.expose
def atualizar_ultimo_login(user_id=None):
    try:
        if not user_id:
            return {"status": "erro", "message": "ID do usuário não informado para atualizar o ultimo_login."}
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            sql_update_last_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
            cursor.execute(sql_update_last_login, (user_id,))
            connection.commit()
            logging.info(f"Campo ultimo_login atualizado para o usuário ID: {user_id}")
            return {"status": "sucesso"}
    except Exception as e:
        logging.error(f"Erro ao atualizar o campo ultimo_login: {e}")
        return {"status": "erro", "message": f"Erro ao atualizar o campo ultimo_login: {e}"}
    

# Função para upload de foto de perfil do usuário
    
@eel.expose
def upload_profile_picture(user_id, base64_image_data, file_extension):
    logging.info(f"Recebida solicitação de upload de foto de perfil para user_id: {user_id}")
    
    upload_dir = 'web/imagens/perfis'
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        logging.info(f"Diretório de upload criado: {upload_dir}")

    try:
        header, encoded_data = base64_image_data.split(',', 1)
        image_data = base64.b64decode(encoded_data)

        file_name = f"profile_{user_id}_{os.urandom(4).hex()}.{file_extension}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        profile_picture_url = f"/imagens/perfis/{file_name}"
        logging.info(f"Foto de perfil salva em: {file_path}")
        logging.info(f"URL da foto de perfil: {profile_picture_url}")

        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        try:
            with connection.cursor() as cursor:
                sql_update = "UPDATE tb_usuarios SET foto_perfil_url = %s WHERE id = %s"
                cursor.execute(sql_update, (profile_picture_url, user_id))
                connection.commit()
            logging.info(f"URL da foto de perfil atualizada no banco de dados para user_id: {user_id}")
            return {"status": "success", "message": "Foto de perfil enviada e salva com sucesso!", "url": profile_picture_url}
        except Exception as db_e:
            logging.error(f"Erro ao atualizar o banco de dados com a URL da foto de perfil: {db_e}")
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.warning(f"Arquivo {file_path} removido devido a erro no DB.")
            return {"status": "error", "message": f"Erro ao salvar a URL da foto de perfil no banco de dados: {db_e}"}
        finally:
            if connection:
                connection.close()

    except Exception as e:
        logging.error(f"Erro no upload_profile_picture: {e}")
        logging.exception("Detalhes do erro no upload_profile_picture:")
        return {"status": "error", "message": f"Erro ao processar a imagem: {e}"}
    

# Função para obter dados completos do perfil do usuário

@eel.expose
def get_user_profile_data(user_id):
    logging.info(f"Buscando dados de perfil completos para user_id: {user_id}")
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            sql_user = "SELECT nome, email, cargo, foto_perfil_url, matricula FROM tb_usuarios WHERE id = %s"
            cursor.execute(sql_user, (user_id,))
            user_data = cursor.fetchone()

            if not user_data:
                logging.warning(f"Nenhum dado de perfil encontrado para user_id: {user_id}")
                return {"status": "not_found", "message": "Usuário não encontrado."}

            sql_neta = "SELECT neta_nome, neta_perfil FROM tb_vinculo_neta WHERE usuario_id = %s"
            cursor.execute(sql_neta, (user_id,))
            neta_data = cursor.fetchone()
            user_data['neta_nome'] = neta_data['neta_nome'] if neta_data else "Não Vinculado"
            user_data['neta_perfil'] = neta_data['neta_perfil'] if neta_data else "Não Vinculado"

            sql_wfm = "SELECT wfm_nome, wfm_perfil FROM tb_vinculo_wfm WHERE usuario_id = %s"
            cursor.execute(sql_wfm, (user_id,))
            wfm_data = cursor.fetchone()
            user_data['wfm_nome'] = wfm_data['wfm_nome'] if wfm_data else "Não Vinculado"
            user_data['wfm_perfil'] = wfm_data['wfm_perfil'] if wfm_data else "Não Vinculado"

            logging.info(f"Dados de perfil completos encontrados para user_id: {user_id}")
            return {"status": "success", "data": user_data}
    except Exception as e:
        logging.error(f"Erro ao buscar dados de perfil no banco de dados: {e}")
        return {"status": "error", "message": f"Erro ao buscar dados de perfil: {e}"}
    finally:
        if connection:
            connection.close()

# Função de callback para fechar o processo Python quando não houver mais conexões WebSocket

def close_callback(page, sockets):
    import threading
    logging.info(f"Conexão websocket fechada para a página: {page}. Sockets restantes: {len(sockets)}")
    def tentar_encerrar():
        import time
        
        time.sleep(5)  # Aguarda 2 segundo para ver se outro socket abre
        if not eel._websockets:  # Se ainda não há sockets, encerra
            logging.info("Nenhuma conexão websocket ativa após delay. Encerrando processo Python.")
            os._exit(0)
        else:
            logging.info("Nova conexão websocket detectada após delay. Não encerra o processo.")

    if not sockets:
        threading.Thread(target=tentar_encerrar, daemon=True).start()
    else:
        logging.info("Conexões WebSocket ainda ativas ou página irrelevante para a macro.")

if __name__ == "__main__":
    try:
        verificar_instancia_unica() # Garante que apenas uma instância seja executada
        logging.info("--- Iniciando Aplicação Eel ---")
        eel.start('login.html', mode='edge', size=(screen_width, screen_height), close_callback=close_callback)
        logging.info("Chamada eel.start retornou.")
    except EnvironmentError as e:
        logging.error(f"Erro de ambiente ao iniciar EEL: {e}")
        logging.exception("Detalhes do erro de ambiente ao iniciar EEL:")
        os._exit(1)
    except Exception as e:
        logging.error(f"Erro geral ao iniciar EEL: {e}")
        logging.exception("Detalhes do erro geral ao iniciar EEL:")
        os._exit(1)

    logging.info("--- Saindo da Aplicação ---")
