using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyVersion("1.0.3.0")]
[assembly: System.Reflection.AssemblyFileVersion("1.0.3.0")]

internal static class SlopeRushLauncher
{
    private const string GameUrl = "https://pelleand3-droid.github.io/sloperush/";
    private const string LatestReleaseApiUrl = "https://api.github.com/repos/pelleand3-droid/sloperush/releases/latest";
    private static readonly string[] GameFiles =
    {
        "index.html",
        "game.js",
        "style.css",
        "supabase-config.js"
    };

    [STAThread]
    private static void Main(string[] args)
    {
        if (args.Length == 4 && args[0] == "--replace-and-launch")
        {
            ReplaceAndLaunch(args);
            return;
        }

        try
        {
            bool skipLauncherUpdate = args.Length == 1 && args[0] == "--skip-launcher-update";
            if (!skipLauncherUpdate)
            {
                try
                {
                    if (UpdateLauncher())
                    {
                        return;
                    }
                }
                catch (Exception updateError)
                {
                    MessageBox.Show(
                        "Slope Rush could not check for launcher updates. It will continue with the installed launcher.\r\n\r\n"
                            + updateError.Message,
                        "Slope Rush launcher update",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);
                }
            }

            string gameDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SlopeRush");
            Directory.CreateDirectory(gameDirectory);
            string currentDirectory = Path.Combine(gameDirectory, "current");

            try
            {
                UpdateGameFiles(gameDirectory, currentDirectory);
            }
            catch (Exception updateError)
            {
                if (!File.Exists(Path.Combine(currentDirectory, "index.html")))
                {
                    throw new InvalidOperationException(
                        "Slope Rush could not download the game files. Check your internet connection and try again.",
                        updateError);
                }

                MessageBox.Show(
                    "Slope Rush could not check for updates, so it will start the saved version.\r\n\r\n"
                        + updateError.Message,
                    "Slope Rush update",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
            }

            string gameUrl = new Uri(Path.Combine(currentDirectory, "index.html")).AbsoluteUri
                + "#launcher=1.0.3";
            string edgePath = FindEdge();

            if (edgePath != null)
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = edgePath,
                    Arguments = "--app=\"" + gameUrl + "\"",
                    UseShellExecute = false
                });
                return;
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = gameUrl,
                UseShellExecute = true
            });
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "Slope Rush could not start.\r\n\r\n" + error.Message,
                "Slope Rush",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private static bool UpdateLauncher()
    {
        string launcherPath = Process.GetCurrentProcess().MainModule.FileName;
        if (string.IsNullOrEmpty(launcherPath) || !File.Exists(launcherPath))
        {
            throw new InvalidOperationException("The launcher file could not be located.");
        }

        ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        using (WebClient client = new WebClient())
        {
            client.Headers[HttpRequestHeader.UserAgent] = "SlopeRushLauncher";
            client.Headers[HttpRequestHeader.Accept] = "application/vnd.github+json";
            string releaseJson = client.DownloadString(LatestReleaseApiUrl);
            Dictionary<string, object> release =
                new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(releaseJson);
            object assetsValue;
            if (release == null || !release.TryGetValue("assets", out assetsValue))
            {
                throw new InvalidOperationException("GitHub did not return the latest release assets.");
            }

            object selectedAsset = null;
            foreach (object assetValue in (object[])assetsValue)
            {
                Dictionary<string, object> asset = assetValue as Dictionary<string, object>;
                object name;
                if (asset != null && asset.TryGetValue("name", out name)
                    && string.Equals(name as string, "SlopeRush.exe", StringComparison.Ordinal))
                {
                    selectedAsset = asset;
                    break;
                }
            }

            Dictionary<string, object> launcherAsset = selectedAsset as Dictionary<string, object>;
            object digestValue;
            object downloadUrlValue;
            if (launcherAsset == null
                || !launcherAsset.TryGetValue("digest", out digestValue)
                || !launcherAsset.TryGetValue("browser_download_url", out downloadUrlValue))
            {
                throw new InvalidOperationException("The latest release does not include a verifiable SlopeRush.exe.");
            }

            string digest = digestValue as string;
            string downloadUrl = downloadUrlValue as string;
            const string digestPrefix = "sha256:";
            if (string.IsNullOrEmpty(digest) || !digest.StartsWith(digestPrefix, StringComparison.Ordinal)
                || string.IsNullOrEmpty(downloadUrl)
                || !downloadUrl.StartsWith("https://github.com/pelleand3-droid/sloperush/releases/download/",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("The latest launcher release information is invalid.");
            }

            string expectedHash = digest.Substring(digestPrefix.Length);
            if (string.Equals(ComputeSha256(File.ReadAllBytes(launcherPath)), expectedHash,
                StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            byte[] updatedLauncher = client.DownloadData(downloadUrl);
            if (!string.Equals(ComputeSha256(updatedLauncher), expectedHash,
                StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("The downloaded launcher failed its SHA-256 verification.");
            }

            string updatePath = launcherPath + ".update-" + Guid.NewGuid().ToString("N") + ".exe";
            File.WriteAllBytes(updatePath, updatedLauncher);
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = updatePath,
                    Arguments = "--replace-and-launch \"" + launcherPath + "\" \"" + updatePath
                        + "\" " + Process.GetCurrentProcess().Id,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                });
            }
            catch
            {
                File.Delete(updatePath);
                throw;
            }

            return true;
        }
    }

    private static string ComputeSha256(byte[] content)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            StringBuilder hash = new StringBuilder(64);
            foreach (byte value in sha256.ComputeHash(content))
            {
                hash.Append(value.ToString("x2"));
            }

            return hash.ToString();
        }
    }

    private static void ReplaceAndLaunch(string[] args)
    {
        try
        {
            int processId;
            if (!int.TryParse(args[3], out processId))
            {
                throw new InvalidOperationException("The launcher update could not identify the previous version.");
            }

            try
            {
                using (Process previousLauncher = Process.GetProcessById(processId))
                {
                    previousLauncher.WaitForExit();
                }
            }
            catch (ArgumentException)
            {
            }

            string launcherPath = Path.GetFullPath(args[1]);
            string updatePath = Path.GetFullPath(args[2]);
            File.Replace(updatePath, launcherPath, null);
            Process.Start(new ProcessStartInfo
            {
                FileName = launcherPath,
                UseShellExecute = false
            });
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "Slope Rush could not install its launcher update.\r\n\r\n" + error.Message,
                "Slope Rush launcher update",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = Path.GetFullPath(args[1]),
                    Arguments = "--skip-launcher-update",
                    UseShellExecute = false
                });
            }
            catch (Exception launchError)
            {
                MessageBox.Show(
                    "The current launcher could not be restarted.\r\n\r\n" + launchError.Message,
                    "Slope Rush",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
    }

    private static void UpdateGameFiles(string gameDirectory, string currentDirectory)
    {
        string updateDirectory = Path.Combine(gameDirectory, "update-" + Guid.NewGuid().ToString("N"));
        string backupDirectory = Path.Combine(gameDirectory, "previous-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(updateDirectory);

        try
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            using (WebClient client = new WebClient())
            {
                client.Headers[HttpRequestHeader.UserAgent] = "SlopeRushLauncher";
                foreach (string file in GameFiles)
                {
                    string downloadUrl = GameUrl + Uri.EscapeDataString(file)
                        + "?update=" + DateTime.UtcNow.Ticks;
                    client.DownloadFile(downloadUrl, Path.Combine(updateDirectory, file));
                }
            }

            foreach (string file in GameFiles)
            {
                string downloadedFile = Path.Combine(updateDirectory, file);
                if (!File.Exists(downloadedFile) || new FileInfo(downloadedFile).Length == 0)
                {
                    throw new InvalidOperationException("The update file is missing or empty: " + file);
                }
            }

            if (Directory.Exists(currentDirectory))
            {
                Directory.Move(currentDirectory, backupDirectory);
            }

            try
            {
                Directory.Move(updateDirectory, currentDirectory);
            }
            catch
            {
                if (Directory.Exists(backupDirectory) && !Directory.Exists(currentDirectory))
                {
                    Directory.Move(backupDirectory, currentDirectory);
                }

                throw;
            }

            if (Directory.Exists(backupDirectory))
            {
                Directory.Delete(backupDirectory, true);
            }
        }
        finally
        {
            if (Directory.Exists(updateDirectory))
            {
                Directory.Delete(updateDirectory, true);
            }
        }
    }

    private static string FindEdge()
    {
        string[] paths =
        {
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                "Microsoft", "Edge", "Application", "msedge.exe")
        };

        foreach (string path in paths)
        {
            if (File.Exists(path))
            {
                return path;
            }
        }

        return null;
    }
}
