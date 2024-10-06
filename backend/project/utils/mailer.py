import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from flask import current_app

def sendEmail(to, subject, body):
  
  message = Mail(
      from_email=current_app.config.get('EMAIL_SENDER'),
      to_emails=to,
      subject=subject,
      html_content=body)
    
  try:
      sg = SendGridAPIClient(current_app.config.get('SENDGRID_API_KEY'))
      response = sg.send(message)
      # print(response.status_code)
      # print(response.body)
      # print(response.headers)
      return response
  except Exception as e:
      print(e.message)