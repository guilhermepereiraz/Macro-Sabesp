import eel
from MacroSITE_V4 import iniciar_macro_multi_thread, parar_macro_event
from Consulta_geral import iniciar_consulta_geral_backend 
import sys
import pymysql # USANDO PyMySQL
import logging # Para o logging
import traceback # Para capturar o traceback
import hashlib
import pymysql.cursors
import random
import smtplib
from email.mime.text import MIMEText


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
        numero_chamado_gerado = "CAD" + str(random.randint(10000, 99999))
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
def verificar_credenciais(email, senha_texto_claro):

    connection = None
    cursor = None
    usuario_identificador = None


    logging.info(f"Tentativa de login para o email: {email}")

    try:

        connection = pymysql.connect(**DB_CONFIG)


        if connection: # <-- Verifica apenas se connection não é None após a tentativa de conexão
            logging.info("Conexão com o banco de dados para login bem-sucedida!")

            cursor = connection.cursor(pymysql.cursors.DictCursor) 


            sql = "SELECT id, nome, email, senha FROM tb_usuarios WHERE email = %s"
            cursor.execute(sql, (email,))

            usuario = cursor.fetchone() # Pega a primeira linha (ou None)

            if usuario:

                stored_senha_no_banco = usuario.get('senha')

                if senha_texto_claro == stored_senha_no_banco:
                    logging.info(f"Login bem-sucedido (texto claro) para: {email}")
                    # Use o ID do usuário como identificador para passar para a macro ou frontend
                    usuario_identificador = usuario.get('nome') # Use 'id' como identificador
                    logging.info(f"Identificador do usuário para a macro: {usuario_identificador}")

                    # --- ADICIONADO: ATUALIZAÇÃO DO CAMPO ultimo_login ---
                    # Use o ID retornado da consulta (usuario.get('nome'))
                    sql_update_login = "UPDATE tb_usuarios SET ultimo_login = CURRENT_TIMESTAMP() WHERE id = %s"
                    cursor.execute(sql_update_login, (usuario.get('id'),))
                    connection.commit()
                    logging.info(f"Campo ultimo_login atualizado para o usuário ID: {usuario.get('id')}")
                    # ----------------------------------------------------

                else:
                    logging.warning(f"Falha de login: Senha incorreta (texto claro) para: {email}")
                    usuario_identificador = None # Senha incorreta
                # --- Fim Lógica de Verificação de Senha EM TEXTO PURO ---

            else:
                logging.warning(f"Falha de login: Usuário com email '{email}' não encontrado.")
                usuario_identificador = None # Usuário não encontrado

            return usuario_identificador




    except pymysql.Error as e:
        # Captura erros específicos do PyMySQL (conexão, query, etc.)
        logging.error(f"Erro do banco de dados (PyMySQL) durante o login: {e}")
        # Use logging.exception() para obter o traceback completo SOMENTE para erros do DB
        logging.exception("Detalhes do erro do banco de dados (PyMySQL) durante o login:")
        # Verifica se connection existe antes de tentar rollback
        if connection:
            connection.rollback()
        return None # Retorna None para o frontend em caso de erro DB

    except Exception as e:
        # Captura QUALQUER outro erro inesperado
        # --- ESTE É O BLOCO COM O LOGGING DETALHADO ---
        logging.error(f"Ocorreu um erro INESPERADO (verificar_credenciais): Tipo={type(e)}, Mensagem='{e}'")
        # Use logging.exception() para obter o traceback completo para QUALQUER Exception
        logging.exception("Detalhes do erro INESPERADO (verificar_credenciais):")
        # --- Fim do Logging Detalhado ---
        # Verifica se connection existe antes de tentar rollback
        if connection:
            connection.rollback() # Garantir rollback se a conexão estava ativa
        return None # Retorna None para o frontend em caso de erro inesperado

    finally:
        # Fecha o cursor e a conexão SEMPRE, mesmo que ocorra um erro
        if cursor:
            cursor.close()
        # --- CORREÇÃO: Removida a verificação .is_connected() no finally ---
        # Verifica se connection existe antes de tentar fechar
        if connection:
            connection.close()
            logging.info("Conexão com o banco de dados para login fechada.")



@eel.expose
def iniciar_macro_eel(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario): # 0 espaços
    logging.info(f"Chamada para iniciar macro para usuário da aplicação '{identificador_usuario}'") # 4 espaços
    logging.info(f"Credenciais passadas para a macro (login site): {login_usuario}, {'*' * len(senha_usuario)}") # 4 espaços
    logging.info(f"Nome do arquivo: {nome_arquivo}, Tipo: {tipo_arquivo}") # 4 espaços

    return iniciar_macro_multi_thread(conteudo_csv, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, identificador_usuario) # 4 espaços

@eel.expose
def iniciar_consulta_geral_frontend(conteudo_arquivo, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_macro, identificador_usuario):
    """
    Função exposta via Eel para ser chamada pelo frontend para iniciar a macro Consulta Geral.
    Esta função apenas repassa os parâmetros para a lógica principal em Consulta_geral.py.
    """
    logging.info(f"Chamada do frontend para iniciar Consulta Geral para usuário '{identificador_usuario}'")
    logging.info(f"Credenciais passadas (Consulta Geral): {login_usuario}, {'*' * len(senha_usuario)}")
    logging.info(f"Arquivo: {nome_arquivo}, Tipo: {tipo_arquivo}, Filtro: {tipo_macro}")

    # Chama a função principal de backend que contém a lógica da macro
    # É importante retornar o resultado dessa chamada de volta para o frontend
    return iniciar_consulta_geral_backend(conteudo_arquivo, login_usuario, senha_usuario, nome_arquivo, tipo_arquivo, tipo_macro, identificador_usuario)

def close_callback(page, sockets):

    logging.info(f"Conexão websocket fechada para a página: {page}. Sockets restantes: {len(sockets)}")


    if not sockets:
        logging.info("Última conexão websocket fechada. Sinalizando para parar a macro e encerrando processo Python.")
        # Sinaliza para as threads da macro pararem de forma segura
        try:
            # Importa o evento de MacroSITE_V4 - Verifique o nome correto se for diferente
            from MacroSITE_V4 import parar_macro_event
            parar_macro_event.set() # Sinaliza o evento de parada global
        except ImportError:
            logging.error("Erro ao importar parar_macro_event de MacroSITE_V4.py. Verifique o nome do arquivo/evento.")
        # Encerra o processo Python
    else:
        logging.info(f"Ainda há {len(sockets)} conexões ativas.")


try: # 0 espaços
    logging.info("--- Iniciando Aplicação Eel ---") # 4 espaços
    eel.start('login.html', size=(1280, 720), close_callback=close_callback) # 4 espaços

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
