package com.minirynth.app.plugins;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

@CapacitorPlugin(name = "LauncherFolders")
public class LauncherFoldersPlugin extends Plugin {
    private static final String TAG = "LauncherFolders";

    @PluginMethod()
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );
        startActivityForResult(call, intent, "pickFolderResult");
    }

    @ActivityCallback
    private void pickFolderResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Cancelled");
            return;
        }

        Uri treeUri = result.getData().getData();
        if (treeUri == null) {
            call.reject("No folder selected");
            return;
        }

        try {
            Context context = getContext();
            int flags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            context.getContentResolver().takePersistableUriPermission(treeUri, flags);

            String treeDocumentId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri rootUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, treeDocumentId);
            String name = queryDisplayName(context, rootUri);
            if (name == null) name = treeUri.getLastPathSegment();

            JSArray children = new JSArray();
            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, treeDocumentId);
            String[] projection = {
                DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE
            };
            Cursor cursor = context.getContentResolver().query(childrenUri, projection, null, null, null);
            if (cursor != null) {
                try {
                    while (cursor.moveToNext()) {
                        String mime = cursor.getString(1);
                        if (!DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) continue;
                        String childName = cursor.getString(0);
                        if (childName != null) children.put(childName);
                    }
                } finally {
                    cursor.close();
                }
            }

            JSObject ret = new JSObject();
            ret.put("uri", treeUri.toString());
            ret.put("name", name == null ? "Folder" : name);
            ret.put("children", children);
            call.resolve(ret);
        } catch (Exception ex) {
            Log.e(TAG, "pickFolderResult", ex);
            call.reject("Could not read that folder", null, ex);
        }
    }

    @PluginMethod()
    public void writeFile(PluginCall call) {
        String uriString = call.getString("uri");
        String folderName = call.getString("folder");
        String filename = call.getString("filename");
        String urlString = call.getString("url");

        if (uriString == null || filename == null || urlString == null) {
            call.reject("Missing file details");
            return;
        }

        call.setKeepAlive(true);
        final PluginCall pending = call;

        new Thread(() -> {
            try {
                Uri treeUri = Uri.parse(uriString);
                Context context = getContext();
                String treeDocumentId = DocumentsContract.getTreeDocumentId(treeUri);
                String folderId = treeDocumentId;
                if (folderName != null && !folderName.isEmpty()) {
                    folderId = ensureFolder(context, treeUri, treeDocumentId, folderName);
                }
                Uri folderUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, folderId);
                Uri fileUri = DocumentsContract.createDocument(
                    context.getContentResolver(), folderUri, guessMime(filename), filename
                );
                if (fileUri == null) throw new IllegalStateException("Could not create file");

                HttpURLConnection connection = (HttpURLConnection) new URL(urlString).openConnection();
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", "Minirynth/0.5.6-dev");

                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    throw new IllegalStateException("Download failed: " + status);
                }

                try (InputStream in = new BufferedInputStream(connection.getInputStream());
                     OutputStream out = context.getContentResolver().openOutputStream(fileUri, "w")) {
                    if (out == null) throw new IllegalStateException("Could not open file for writing");
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                } finally {
                    connection.disconnect();
                }

                JSObject ret = new JSObject();
                ret.put("uri", fileUri.toString());
                ret.put("filename", filename);
                getBridge().getActivity().runOnUiThread(() -> pending.resolve(ret));
            } catch (Exception ex) {
                Log.e(TAG, "writeFile", ex);
                String message = ex.getMessage() == null ? "Download failed" : ex.getMessage();
                getBridge().getActivity().runOnUiThread(() -> pending.reject(message, null, ex));
            }
        }).start();
    }

    @PluginMethod()
    public void listFiles(PluginCall call) {
        String uriString = call.getString("uri");
        if (uriString == null) {
            call.reject("Missing folder");
            return;
        }
        String folderName = call.getString("folder");

        try {
            Uri treeUri = Uri.parse(uriString);
            String parentDocumentId = DocumentsContract.getTreeDocumentId(treeUri);
            if (folderName != null && !folderName.isEmpty()) {
                String found = findChild(getContext(), treeUri, parentDocumentId, folderName, true);
                if (found == null) {
                    JSObject empty = new JSObject();
                    empty.put("files", new JSArray());
                    call.resolve(empty);
                    return;
                }
                parentDocumentId = found;
            }

            JSArray files = new JSArray();
            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentDocumentId);
            String[] projection = {
                DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE,
                DocumentsContract.Document.COLUMN_SIZE,
                DocumentsContract.Document.COLUMN_LAST_MODIFIED
            };
            Cursor cursor = getContext().getContentResolver().query(childrenUri, projection, null, null, null);
            if (cursor != null) {
                try {
                    while (cursor.moveToNext()) {
                        String mime = cursor.getString(1);
                        if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) continue;
                        String name = cursor.getString(0);
                        if (name == null) continue;

                        JSObject item = new JSObject();
                        item.put("name", name);
                        item.put("size", cursor.getLong(2));
                        item.put("modified", cursor.getLong(3));
                        files.put(item);
                    }
                } finally {
                    cursor.close();
                }
            }

            JSObject ret = new JSObject();
            ret.put("files", files);
            call.resolve(ret);
        } catch (Exception ex) {
            Log.e(TAG, "listFiles", ex);
            call.reject("Could not list that folder", null, ex);
        }
    }

    @PluginMethod()
    public void deleteFile(PluginCall call) {
        String uriString = call.getString("uri");
        String name = call.getString("name");
        if (uriString == null || name == null) {
            call.reject("Missing file details");
            return;
        }
        String folderName = call.getString("folder");

        try {
            Uri treeUri = Uri.parse(uriString);
            String parentDocumentId = DocumentsContract.getTreeDocumentId(treeUri);
            if (folderName != null && !folderName.isEmpty()) {
                String found = findChild(getContext(), treeUri, parentDocumentId, folderName, true);
                if (found == null) {
                    call.reject("Folder not found");
                    return;
                }
                parentDocumentId = found;
            }
            String documentId = findChild(getContext(), treeUri, parentDocumentId, name, false);
            if (documentId == null) {
                call.reject("File not found");
                return;
            }
            Uri documentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId);
            if (!DocumentsContract.deleteDocument(getContext().getContentResolver(), documentUri)) {
                call.reject("Could not delete file");
                return;
            }
            call.resolve();
        } catch (Exception ex) {
            Log.e(TAG, "deleteFile", ex);
            call.reject("Could not delete file", null, ex);
        }
    }

    private String queryDisplayName(Context context, Uri uri) {
        String[] projection = { DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        Cursor cursor = context.getContentResolver().query(uri, projection, null, null, null);
        if (cursor == null) return null;
        try {
            if (cursor.moveToFirst()) return cursor.getString(0);
            return null;
        } finally {
            cursor.close();
        }
    }

    private String ensureFolder(Context context, Uri treeUri, String parentDocumentId, String name)
        throws Exception {
        String existing = findChild(context, treeUri, parentDocumentId, name, true);
        if (existing != null) return existing;

        Uri parentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, parentDocumentId);
        Uri created = DocumentsContract.createDocument(
            context.getContentResolver(), parentUri, DocumentsContract.Document.MIME_TYPE_DIR, name
        );
        if (created == null) throw new IllegalStateException("Could not create folder " + name);
        return DocumentsContract.getDocumentId(created);
    }

    private String findChild(Context context, Uri treeUri, String parentDocumentId, String name, boolean directory) {
        String[] projection = {
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE
        };
        Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentDocumentId);
        Cursor cursor = context.getContentResolver().query(childrenUri, projection, null, null, null);
        if (cursor == null) return null;
        try {
            while (cursor.moveToNext()) {
                String displayName = cursor.getString(1);
                String mime = cursor.getString(2);
                if (displayName == null) continue;
                if (!displayName.toLowerCase(Locale.US).equals(name.toLowerCase(Locale.US))) continue;
                if (directory && !DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) continue;
                if (!directory && DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) continue;
                return cursor.getString(0);
            }
            return null;
        } finally {
            cursor.close();
        }
    }

    private String guessMime(String filename) {
        String lower = filename.toLowerCase(Locale.US);
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".jar")) return "application/java-archive";
        return "application/octet-stream";
    }
}
