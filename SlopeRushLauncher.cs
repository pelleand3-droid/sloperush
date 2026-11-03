using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyVersion("1.0.5.0")]
[assembly: System.Reflection.AssemblyFileVersion("1.0.5.0")]

internal static class SlopeRushLauncher
{
    private const string GameUrl = "https://pelleand3-droid.github.io/sloperush/";
    private const string GamesCatalogUrl = GameUrl + "games.json";
    private const string LatestReleaseApiUrl = "https://api.github.com/repos/pelleand3-droid/sloperush/releases/latest";
    private const string GameLauncherToken = "#launcher=1.0.4";

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

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            ShowLauncher();
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

    private static void ShowLauncher()
    {
        string gameDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "SlopeRush");
        Directory.CreateDirectory(gameDirectory);

        string catalogWarning;
        List<GameEntry> catalog = LoadGameCatalog(gameDirectory, out catalogWarning);
        Form form = new Form
        {
            Text = "Slope Rush Launcher",
            StartPosition = FormStartPosition.CenterScreen,
            MinimumSize = new Size(620, 390),
            Size = new Size(760, 480),
            BackColor = Color.FromArgb(245, 240, 229),
            Font = new Font("Segoe UI", 10)
        };
        TableLayoutPanel layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(18),
            ColumnCount = 2,
            RowCount = 2
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 245));
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 58));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        Label heading = new Label
        {
            Text = "SLOPE RUSH ARCADE",
            Dock = DockStyle.Fill,
            Font = new Font("Segoe UI", 20, FontStyle.Bold),
            ForeColor = Color.FromArgb(29, 41, 37),
            TextAlign = ContentAlignment.MiddleLeft
        };
        layout.Controls.Add(heading, 0, 0);
        layout.SetColumnSpan(heading, 2);

        ListBox gameList = new ListBox
        {
            Dock = DockStyle.Fill,
            IntegralHeight = false,
            Font = new Font("Segoe UI", 11)
        };
        layout.Controls.Add(gameList, 0, 1);

        Panel detailsPanel = new Panel { Dock = DockStyle.Fill, Padding = new Padding(22, 8, 0, 0) };
        Label description = new Label
        {
            Dock = DockStyle.Top,
            Height = 110,
            ForeColor = Color.FromArgb(70, 83, 75),
            AutoEllipsis = true
        };
        Label installStatus = new Label
        {
            Dock = DockStyle.Top,
            Height = 35,
            ForeColor = Color.FromArgb(22, 121, 104),
            Font = new Font("Segoe UI", 9, FontStyle.Bold)
        };
        FlowLayoutPanel buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            Height = 48,
            FlowDirection = FlowDirection.LeftToRight,
            WrapContents = false
        };
        Button launchButton = new Button { Text = "Play", Width = 105, Height = 34, Enabled = false };
        Button installButton = new Button { Text = "Download", Width = 135, Height = 34, Enabled = false };
        Button refreshButton = new Button { Text = "Refresh", Width = 95, Height = 34 };
        buttons.Controls.Add(launchButton);
        buttons.Controls.Add(installButton);
        buttons.Controls.Add(refreshButton);
        detailsPanel.Controls.Add(buttons);
        detailsPanel.Controls.Add(installStatus);
        detailsPanel.Controls.Add(description);
        layout.Controls.Add(detailsPanel, 1, 1);
        form.Controls.Add(layout);

        Action refreshSelection = delegate
        {
            GameEntry selected = gameList.SelectedItem as GameEntry;
            if (selected == null)
            {
                description.Text = "Choose a game to see its details.";
                installStatus.Text = "";
                launchButton.Enabled = false;
                installButton.Enabled = false;
                return;
            }

            bool installed = IsGameInstalled(gameDirectory, selected);
            description.Text = selected.description;
            installStatus.Text = installed ? "INSTALLED — ready to play" : "NOT INSTALLED — download to play";
            launchButton.Enabled = installed;
            installButton.Enabled = true;
            installButton.Text = installed ? "Update" : "Download";
        };

        foreach (GameEntry game in catalog)
        {
            gameList.Items.Add(game);
        }
        gameList.SelectedIndexChanged += delegate { refreshSelection(); };
        if (gameList.Items.Count > 0)
        {
            gameList.SelectedIndex = 0;
        }

        installButton.Click += delegate
        {
            GameEntry selected = gameList.SelectedItem as GameEntry;
            if (selected == null) return;

            installButton.Enabled = false;
            launchButton.Enabled = false;
            installButton.Text = "Downloading...";
            Cursor previousCursor = form.Cursor;
            form.Cursor = Cursors.WaitCursor;
            try
            {
                InstallGameFiles(gameDirectory, selected);
                refreshSelection();
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    form,
                    "The game could not be downloaded or updated.\r\n\r\n" + error.Message,
                    "Slope Rush Launcher",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                refreshSelection();
            }
            finally
            {
                form.Cursor = previousCursor;
            }
        };

        launchButton.Click += delegate
        {
            GameEntry selected = gameList.SelectedItem as GameEntry;
            if (selected == null) return;
            try
            {
                LaunchGame(gameDirectory, selected);
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    form,
                    "The game could not be started.\r\n\r\n" + error.Message,
                    "Slope Rush Launcher",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        };

        refreshButton.Click += delegate
        {
            try
            {
                string warning;
                List<GameEntry> refreshedCatalog = LoadGameCatalog(gameDirectory, out warning);
                gameList.Items.Clear();
                foreach (GameEntry game in refreshedCatalog)
                {
                    gameList.Items.Add(game);
                }
                if (gameList.Items.Count > 0) gameList.SelectedIndex = 0;
                if (!string.IsNullOrEmpty(warning))
                {
                    MessageBox.Show(form, warning, "Game catalog", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    form,
                    "The game catalog could not be refreshed.\r\n\r\n" + error.Message,
                    "Game catalog",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        };

        form.Shown += delegate
        {
            if (!string.IsNullOrEmpty(catalogWarning))
            {
                MessageBox.Show(form, catalogWarning, "Game catalog", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        };
        Application.Run(form);
    }

    private static List<GameEntry> LoadGameCatalog(string gameDirectory, out string warning)
    {
        string cachePath = Path.Combine(gameDirectory, "games.json");
        warning = "";
        ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        try
        {
            string catalogJson;
            using (WebClient client = new WebClient())
            {
                client.Headers[HttpRequestHeader.UserAgent] = "SlopeRushLauncher";
                catalogJson = client.DownloadString(GamesCatalogUrl);
            }

            List<GameEntry> catalog = DeserializeCatalog(catalogJson);
            File.WriteAllText(cachePath, catalogJson, Encoding.UTF8);
            return catalog;
        }
        catch (Exception downloadError)
        {
            if (!File.Exists(cachePath))
            {
                throw new InvalidOperationException(
                    "The game list could not be downloaded and no saved game list is available.",
                    downloadError);
            }

            try
            {
                List<GameEntry> cachedCatalog = DeserializeCatalog(File.ReadAllText(cachePath, Encoding.UTF8));
                warning = "Could not refresh the game list. Showing the saved catalog instead.\r\n\r\n"
                    + downloadError.Message;
                return cachedCatalog;
            }
            catch (Exception cacheError)
            {
                throw new InvalidOperationException(
                    "The online game list could not be downloaded, and the saved game list is invalid.",
                    cacheError);
            }
        }
    }

    private static List<GameEntry> DeserializeCatalog(string json)
    {
        List<GameEntry> catalog = new JavaScriptSerializer().Deserialize<List<GameEntry>>(json);
        if (catalog == null || catalog.Count == 0)
        {
            throw new InvalidOperationException("The game catalog is empty or invalid.");
        }

        HashSet<string> ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (GameEntry game in catalog)
        {
            if (game == null || string.IsNullOrWhiteSpace(game.id) || !IsSafeGameId(game.id)
                || string.IsNullOrWhiteSpace(game.name) || string.IsNullOrWhiteSpace(game.description)
                || string.IsNullOrWhiteSpace(game.baseUrl) || game.files == null || game.files.Length == 0
                || !ids.Add(game.id))
            {
                throw new InvalidOperationException("The game catalog contains an invalid or duplicate entry.");
            }

            Uri baseUri;
            if (!Uri.TryCreate(game.baseUrl, UriKind.Absolute, out baseUri)
                || !string.Equals(baseUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
                || !game.baseUrl.StartsWith(GameUrl, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("A game catalog entry has an untrusted download address.");
            }

            bool hasIndex = false;
            HashSet<string> files = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (string file in game.files)
            {
                if (!IsSafeRelativePath(file) || !files.Add(file))
                {
                    throw new InvalidOperationException("A game catalog entry contains an unsafe or duplicate file path.");
                }
                if (string.Equals(file, "index.html", StringComparison.OrdinalIgnoreCase)) hasIndex = true;
            }
            if (!hasIndex)
            {
                throw new InvalidOperationException("Every game must include an index.html file.");
            }
        }

        return catalog;
    }

    private static bool IsSafeGameId(string id)
    {
        foreach (char character in id)
        {
            if (!(character >= 'a' && character <= 'z') && !(character >= 'A' && character <= 'Z')
                && !(character >= '0' && character <= '9') && character != '-')
            {
                return false;
            }
        }
        return true;
    }

    private static bool IsSafeRelativePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || path.StartsWith("/", StringComparison.Ordinal)
            || path.IndexOf('\\') >= 0 || path.IndexOf(':') >= 0 || path.IndexOf('?') >= 0
            || path.IndexOf('#') >= 0)
        {
            return false;
        }

        string[] segments = path.Split('/');
        foreach (string segment in segments)
        {
            if (string.IsNullOrEmpty(segment) || segment == "." || segment == ".."
                || segment.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            {
                return false;
            }
        }
        return true;
    }

    private static bool IsGameInstalled(string gameDirectory, GameEntry game)
    {
        return File.Exists(Path.Combine(GetInstalledGameDirectory(gameDirectory, game), "index.html"));
    }

    private static string GetInstalledGameDirectory(string gameDirectory, GameEntry game)
    {
        return Path.Combine(gameDirectory, "games", game.id);
    }

    private static void InstallGameFiles(string gameDirectory, GameEntry game)
    {
        string gamesDirectory = Path.Combine(gameDirectory, "games");
        Directory.CreateDirectory(gamesDirectory);
        string installDirectory = GetInstalledGameDirectory(gameDirectory, game);
        string stagingDirectory = Path.Combine(gameDirectory, "staging-" + game.id + "-" + Guid.NewGuid().ToString("N"));
        string backupDirectory = Path.Combine(gameDirectory, "backup-" + game.id + "-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(stagingDirectory);
        try
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            using (WebClient client = new WebClient())
            {
                client.Headers[HttpRequestHeader.UserAgent] = "SlopeRushLauncher";
                foreach (string file in game.files)
                {
                    string[] segments = file.Split('/');
                    string relativePath = Path.Combine(segments);
                    string destination = Path.Combine(stagingDirectory, relativePath);
                    Directory.CreateDirectory(Path.GetDirectoryName(destination));

                    List<string> escapedSegments = new List<string>();
                    foreach (string segment in segments)
                    {
                        escapedSegments.Add(Uri.EscapeDataString(segment));
                    }
                    string escapedPath = string.Join("/", escapedSegments.ToArray());
                    string downloadUrl = game.baseUrl.TrimEnd('/') + "/" + escapedPath;
                    client.DownloadFile(downloadUrl, destination);
                    if (!File.Exists(destination) || new FileInfo(destination).Length == 0)
                    {
                        throw new InvalidOperationException("A downloaded game file was missing or empty: " + file);
                    }
                }
            }

            if (Directory.Exists(installDirectory)) Directory.Move(installDirectory, backupDirectory);
            try
            {
                Directory.Move(stagingDirectory, installDirectory);
            }
            catch
            {
                if (Directory.Exists(backupDirectory) && !Directory.Exists(installDirectory))
                {
                    Directory.Move(backupDirectory, installDirectory);
                }
                throw;
            }

            if (Directory.Exists(backupDirectory)) Directory.Delete(backupDirectory, true);
        }
        finally
        {
            if (Directory.Exists(stagingDirectory)) Directory.Delete(stagingDirectory, true);
        }
    }

    private static void LaunchGame(string gameDirectory, GameEntry game)
    {
        string indexPath = Path.Combine(GetInstalledGameDirectory(gameDirectory, game), "index.html");
        if (!File.Exists(indexPath))
        {
            throw new InvalidOperationException("Download this game before trying to play it.");
        }

        string gameUrl = new Uri(indexPath).AbsoluteUri + GameLauncherToken;
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

        Process.Start(new ProcessStartInfo { FileName = gameUrl, UseShellExecute = true });
    }

    private sealed class GameEntry
    {
        public string id { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public string baseUrl { get; set; }
        public string[] files { get; set; }

        public override string ToString()
        {
            return name;
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
            object tagValue;
            Version latestVersion;
            if (release == null || !release.TryGetValue("tag_name", out tagValue)
                || !Version.TryParse((tagValue as string ?? "").TrimStart('v', 'V'), out latestVersion))
            {
                throw new InvalidOperationException("GitHub did not return a valid launcher release version.");
            }

            if (latestVersion < System.Reflection.Assembly.GetExecutingAssembly().GetName().Version)
            {
                return false;
            }

            object assetsValue;
            if (release == null || !release.TryGetValue("assets", out assetsValue))
            {
                throw new InvalidOperationException("GitHub did not return the latest release assets.");
            }

            IEnumerable assets = assetsValue as IEnumerable;
            if (assets == null)
            {
                throw new InvalidOperationException("GitHub returned an invalid release assets list.");
            }

            object selectedAsset = null;
            foreach (object assetValue in assets)
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
