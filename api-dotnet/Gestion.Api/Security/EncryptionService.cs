using System.Security.Cryptography;
using System.Text;

namespace Gestion.Api.Security;

/// <summary>
/// Cifra y descifra datos confidenciales con AES-256-GCM (cifrado autenticado).
/// La llave sale de ENCRYPTION_KEY (base64, 32 bytes), que vive FUERA del JWT y
/// de la base de datos: filtrar cualquiera de los dos no permite descifrar nada.
/// </summary>
public class EncryptionService
{
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private readonly byte[] _key;

    public EncryptionService()
    {
        var b64 = Environment.GetEnvironmentVariable("ENCRYPTION_KEY")
                  ?? throw new InvalidOperationException("Falta ENCRYPTION_KEY en el entorno.");
        _key = Convert.FromBase64String(b64);
        if (_key.Length != 32)
            throw new InvalidOperationException("ENCRYPTION_KEY debe ser de 32 bytes (AES-256).");
    }

    public string Encrypt(string plainText)
    {
        var plain = Encoding.UTF8.GetBytes(plainText);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var cipher = new byte[plain.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plain, cipher, tag);

        // Formato de salida: nonce + tag + texto cifrado, todo en base64.
        var output = new byte[NonceSize + TagSize + cipher.Length];
        Buffer.BlockCopy(nonce, 0, output, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, output, NonceSize, TagSize);
        Buffer.BlockCopy(cipher, 0, output, NonceSize + TagSize, cipher.Length);
        return Convert.ToBase64String(output);
    }

    public string Decrypt(string cipherText)
    {
        var data = Convert.FromBase64String(cipherText);
        var nonce = data.AsSpan(0, NonceSize);
        var tag = data.AsSpan(NonceSize, TagSize);
        var cipher = data.AsSpan(NonceSize + TagSize);
        var plain = new byte[cipher.Length];

        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }
}
