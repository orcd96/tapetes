import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientAddress',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(blank=True, help_text='Ej: Casa, Oficina, Bodega', max_length=100)),
                ('address', models.TextField()),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('client', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='addresses',
                    to='clients.client',
                )),
            ],
            options={
                'verbose_name': 'Domicilio',
                'verbose_name_plural': 'Domicilios',
                'ordering': ['-is_default', 'label'],
            },
        ),
    ]
