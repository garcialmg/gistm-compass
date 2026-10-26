namespace GistmCompass.Domain.Services;

/// <summary>Port of src/lib/maturity.ts</summary>
public static class Maturity
{
    public static string Label(double pct, bool hasData)
    {
        if (!hasData) return "Sem avaliação";
        if (pct >= 75) return "Otimizado";
        if (pct >= 50) return "Gerenciado";
        if (pct >= 25) return "Em desenvolvimento";
        return "Inicial";
    }
}
