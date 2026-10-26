using System.Text;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using GistmCompass.Application.Abstractions;
using UglyToad.PdfPig;

namespace GistmCompass.Infrastructure.Extraction;

public class TextExtractionService : ITextExtractionService
{
    private const int MaxChars = 200_000;

    public async Task<string?> ExtractAsync(Stream content, string extension, CancellationToken ct = default)
    {
        var ext = extension.StartsWith('.') ? extension.ToLowerInvariant() : "." + extension.ToLowerInvariant();
        return ext switch
        {
            ".txt" or ".md" => await ReadPlainAsync(content, ct),
            ".docx" => ExtractDocx(content),
            ".xlsx" => ExtractXlsx(content),
            ".pdf" => ExtractPdf(content),
            _ => null
        };
    }

    private static async Task<string> ReadPlainAsync(Stream content, CancellationToken ct)
    {
        using var reader = new StreamReader(content, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var text = await reader.ReadToEndAsync(ct);
        return Truncate(text);
    }

    private static string ExtractDocx(Stream content)
    {
        using var ms = new MemoryStream();
        content.CopyTo(ms);
        ms.Position = 0;
        using var doc = WordprocessingDocument.Open(ms, false);
        var body = doc.MainDocumentPart?.Document.Body;
        if (body is null) return string.Empty;
        var sb = new StringBuilder();
        foreach (var text in body.Descendants<Text>())
            sb.Append(text.Text).Append(' ');
        return Truncate(sb.ToString());
    }

    private static string ExtractXlsx(Stream content)
    {
        using var ms = new MemoryStream();
        content.CopyTo(ms);
        ms.Position = 0;
        using var workbook = new XLWorkbook(ms);
        var sb = new StringBuilder();
        foreach (var ws in workbook.Worksheets)
        {
            sb.AppendLine(ws.Name);
            foreach (var row in ws.RangeUsed()?.Rows() ?? Enumerable.Empty<IXLRangeRow>())
            {
                var cells = row.Cells().Select(c => c.GetString());
                sb.AppendLine(string.Join('\t', cells));
            }
        }
        return Truncate(sb.ToString());
    }

    private static string ExtractPdf(Stream content)
    {
        using var ms = new MemoryStream();
        content.CopyTo(ms);
        ms.Position = 0;
        using var document = PdfDocument.Open(ms);
        var sb = new StringBuilder();
        foreach (var page in document.GetPages())
            sb.AppendLine(page.Text);
        return Truncate(sb.ToString());
    }

    private static string Truncate(string text) =>
        text.Length <= MaxChars ? text : text[..MaxChars];
}
