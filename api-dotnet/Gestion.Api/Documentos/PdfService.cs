using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Gestion.Api.Documentos;

/// <summary>Una línea del documento para el PDF.</summary>
public record DocumentoPdfLinea(string Descripcion, int Cantidad, decimal ValorUnitario, decimal Subtotal);

/// <summary>Modelo genérico para imprimir cualquier documento de inventario como PDF.</summary>
public class DocumentoPdf
{
    public string EmpresaNombre { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }

    public string TerceroLabel { get; set; } = string.Empty;
    public string TerceroValor { get; set; } = string.Empty;
    public string? Referencia { get; set; }
    public string? Observaciones { get; set; }

    /// <summary>Encabezado de la columna de valor (Costo unit. / Precio unit.).</summary>
    public string ValorLabel { get; set; } = "Valor unit.";

    /// <summary>Si es false (p.ej. remisiones), no se imprimen columnas de valor ni total.</summary>
    public bool MostrarValores { get; set; } = true;

    public List<DocumentoPdfLinea> Lineas { get; set; } = new();
    public decimal Total { get; set; }
}

/// <summary>Genera el PDF de un documento a partir del modelo genérico.</summary>
public class PdfService
{
    public byte[] Generar(DocumentoPdf m)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                page.Header().Element(h => Encabezado(h, m));
                page.Content().PaddingVertical(16).Element(c => Contenido(c, m));
                page.Footer().Element(Pie);
            });
        }).GeneratePdf();
    }

    private static void Encabezado(IContainer c, DocumentoPdf m)
    {
        c.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(m.EmpresaNombre).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text("Sistema de gestión de inventario").FontSize(9).FontColor(Colors.Grey.Medium);
            });
            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text(m.Titulo).FontSize(13).SemiBold();
                col.Item().Text(m.Numero).FontSize(15).Bold();
                col.Item().Text($"Estado: {m.Estado}").FontSize(9).FontColor(Colors.Grey.Darken1);
                col.Item().Text($"Fecha: {m.Fecha.ToLocalTime():yyyy-MM-dd HH:mm}").FontSize(9).FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private static void Contenido(IContainer c, DocumentoPdf m)
    {
        c.Column(col =>
        {
            col.Spacing(10);

            col.Item().PaddingTop(6).BorderTop(1).BorderColor(Colors.Grey.Lighten2);

            col.Item().Row(row =>
            {
                row.RelativeItem().Text(txt =>
                {
                    txt.Span($"{m.TerceroLabel}: ").SemiBold();
                    txt.Span(m.TerceroValor);
                });
                if (!string.IsNullOrWhiteSpace(m.Referencia))
                {
                    row.RelativeItem().AlignRight().Text(txt =>
                    {
                        txt.Span("Referencia: ").SemiBold();
                        txt.Span(m.Referencia);
                    });
                }
            });

            if (!string.IsNullOrWhiteSpace(m.Observaciones))
            {
                col.Item().Text(txt =>
                {
                    txt.Span("Observaciones: ").SemiBold();
                    txt.Span(m.Observaciones);
                });
            }

            col.Item().Element(t => Tabla(t, m));

            if (m.MostrarValores)
            {
                col.Item().AlignRight().PaddingTop(4).Text($"Total: $ {m.Total:N0}").FontSize(12).Bold();
            }
        });
    }

    private static void Tabla(IContainer c, DocumentoPdf m)
    {
        c.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(28);   // #
                cols.RelativeColumn();     // Descripción
                cols.ConstantColumn(70);   // Cantidad
                if (m.MostrarValores)
                {
                    cols.ConstantColumn(90); // Valor unit.
                    cols.ConstantColumn(90); // Subtotal
                }
            });

            table.Header(header =>
            {
                CeldaEncabezado(header.Cell(), "#");
                CeldaEncabezado(header.Cell(), "Descripción");
                CeldaEncabezado(header.Cell().AlignRight(), "Cantidad");
                if (m.MostrarValores)
                {
                    CeldaEncabezado(header.Cell().AlignRight(), m.ValorLabel);
                    CeldaEncabezado(header.Cell().AlignRight(), "Subtotal");
                }
            });

            var i = 1;
            foreach (var l in m.Lineas)
            {
                Celda(table.Cell(), i.ToString());
                Celda(table.Cell(), l.Descripcion);
                Celda(table.Cell().AlignRight(), l.Cantidad.ToString("N0"));
                if (m.MostrarValores)
                {
                    Celda(table.Cell().AlignRight(), $"$ {l.ValorUnitario:N0}");
                    Celda(table.Cell().AlignRight(), $"$ {l.Subtotal:N0}");
                }
                i++;
            }
        });
    }

    private static void CeldaEncabezado(IContainer c, string texto) =>
        c.Background(Colors.Grey.Lighten3).PaddingVertical(5).PaddingHorizontal(4)
            .Text(texto).SemiBold().FontSize(9);

    private static void Celda(IContainer c, string texto) =>
        c.BorderBottom(1).BorderColor(Colors.Grey.Lighten3).PaddingVertical(5).PaddingHorizontal(4)
            .Text(texto);

    private static void Pie(IContainer c)
    {
        c.BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text($"Generado el {DateTime.Now:yyyy-MM-dd HH:mm}")
                .FontSize(8).FontColor(Colors.Grey.Medium);
            row.RelativeItem().AlignRight().Text(txt =>
            {
                txt.Span("Página ").FontSize(8).FontColor(Colors.Grey.Medium);
                txt.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                txt.Span(" de ").FontSize(8).FontColor(Colors.Grey.Medium);
                txt.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
            });
        });
    }
}
