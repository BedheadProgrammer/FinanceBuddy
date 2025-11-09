from django.db import models
#Creates the tables in the PostgreSQL database

#User Account table stores users

#Audit Log stores when the user loggedin/logged out

#Saved Runs stores the saved option pricing runs

#OpenAIAPIResponse stores the OpenAI API responses


class UserAccounts(models.Model):
    Username = models.CharField(primary_key=True, max_length=150)
    HashedPassword = models.CharField(max_length=255)
    Date_Created = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    id = models.AutoField(primary_key=True)
    Date_Created = models.DateTimeField(auto_now_add=True)
    ACTION_CHOICES = [
        ("Login", "Login"),
        ("Logout", "Logout"),
    ]
    Action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    Username = models.ForeignKey(UserAccounts, to_field="Username", on_delete=models.CASCADE)

class SavedRuns(models.Model):
    id = models.AutoField(primary_key=True)
    Date_Created = models.DateTimeField(auto_now_add=True)
    SpotPrice = models.FloatField()
    StrikePrice = models.FloatField()
    TimeToExpiry = models.FloatField()
    RiskFreeRate = models.FloatField()
    DividendYield = models.FloatField()
    Volatility = models.FloatField()
    Price = models.FloatField()
    Rho = models.FloatField()
    Gamma = models.FloatField()
    OptionType = models.CharField(max_length=4, choices=[("Call", "Call"), ("Put", "Put")])
    ImpliedVolatility = models.FloatField()
    Theta = models.FloatField()
    Vega = models.FloatField()
    Delta = models.FloatField()
    Username = models.ForeignKey(UserAccounts, to_field="Username", on_delete=models.CASCADE)

class OPENAIAPIRESPONSE(models.Model):
    id = models.AutoField(primary_key=True)
    Date_Added = models.DateTimeField(auto_now_add=True)
    UserQuestion = models.TextField()
    APIResponse = models.TextField()
    SavedRun = models.ForeignKey(SavedRuns, to_field="id", on_delete=models.CASCADE)
    Username = models.ForeignKey(UserAccounts, to_field="Username", on_delete=models.CASCADE)


