from flask import Blueprint, render_template, redirect, request

from .forms import MyForm
from .tasks import add_user

views = Blueprint('views', __name__)

@views.route('/create_user', methods=['GET', 'POST'])
def create_user():
    form = MyForm()

    if form.validate_on_submit():
        task = add_user.delay(form.data)
        return render_template("cancel.html", task=task)

    return render_template('form.html', form=form)

@views.route("/cancel/<task_id>")
def cancel(task_id):
    task = add_user.AsyncResult(task_id)
    task.abort()
    return "CANCELED!"