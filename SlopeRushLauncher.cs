using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Windows.Forms;

internal static class SlopeRushLauncher
{
    private const string GameUrl = "https://pelleand3-droid.github.io/sloperush/";
    private static readonly string[] GameFiles =
    {
        "index.html",
        "game.js",
        "style.css",
        "supabase-config.js"
    };

    [STAThread]
    private static void Main()
    {
        try
        {
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

            string gameUrl = new Uri(Path.Combine(currentDirectory, "index.html")).AbsoluteUri;
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
