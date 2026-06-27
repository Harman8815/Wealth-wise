from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='budgetcategory',
            name='text_color',
            field=models.CharField(max_length=7, default='#ffffff'),
        ),
        migrations.AddField(
            model_name='budgetcategory',
            name='symbol',
            field=models.CharField(
                choices=[
                    ('utensils', 'Utensils'),
                    ('car', 'Car'),
                    ('shopping-cart', 'Shopping Cart'),
                    ('film', 'Film'),
                    ('home', 'Home'),
                    ('heart-pulse', 'Healthcare'),
                    ('fuel', 'Fuel'),
                    ('wifi', 'Internet'),
                    ('phone', 'Phone'),
                    ('credit-card', 'Credit Card'),
                    ('gift', 'Gift'),
                    ('coffee', 'Coffee'),
                    ('book', 'Education'),
                    ('plane', 'Travel'),
                    ('dumbbell', 'Fitness'),
                    ('music', 'Music'),
                    ('shirt', 'Shopping'),
                    ('zap', 'Utilities'),
                    ('piggy-bank', 'Savings'),
                    ('briefcase', 'Work'),
                ],
                default='utensils',
                max_length=50,
            ),
        ),
    ]
