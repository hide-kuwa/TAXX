import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });
    }

    // --- 1. 環境変数の読み込み ---
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const rootFolderId = process.env.GOOGLE_ROOT_FOLDER_ID;

    // 設定漏れチェック
    if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
      console.error("環境変数が不足しています");
      return NextResponse.json({ error: 'サーバー設定エラー: 鍵が足りません' }, { status: 500 });
    }

    // --- 2. OAuth2認証 (ここが最強の合鍵！) ---
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth });

    // --- 3. ファイルをGoogleドライブへ送信 ---
    // データを変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // アップロード実行
    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,          // ファイル名
        parents: [rootFolderId],  // 保存先のフォルダID
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink', // 完了後に欲しい情報
    });

    console.log("★Upload Success! File ID:", driveResponse.data.id);

    return NextResponse.json({ 
      success: true, 
      fileId: driveResponse.data.id,
      name: driveResponse.data.name,
      webViewLink: driveResponse.data.webViewLink 
    });

  } catch (error: any) {
    console.error('Drive Upload Error:', error);
    return NextResponse.json({ error: error.message || '保存に失敗しました' }, { status: 500 });
  }
}