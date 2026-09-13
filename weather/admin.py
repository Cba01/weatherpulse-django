from django.contrib import admin

from .models import City, FavoriteCity, WeatherAlert


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "lat", "lon")
    search_fields = ("name", "country")


@admin.register(FavoriteCity)
class FavoriteCityAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "added_at")
    list_filter = ("added_at",)


@admin.register(WeatherAlert)
class WeatherAlertAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "condition", "threshold", "is_active", "last_triggered")
    list_filter = ("condition", "is_active")
