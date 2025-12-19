import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleSheetsService {
    private sheets: any;
    private drive: any;
    private auth: GoogleAuth | any;

    constructor() {
        this.auth = null;
        this.sheets = null;
        this.drive = null;
    }

    async authenticate() {
        const SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ];
        const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

        if (!fs.existsSync(CREDENTIALS_PATH)) {
            throw new Error('credentials.json file not found. Please download it from Google Cloud Console.');
        }

        // Read the credentials file
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

        // Check if it's a service account or OAuth credentials
        if (credentials.type === 'service_account') {
            // Use service account authentication
            this.auth = new google.auth.GoogleAuth({
                keyFile: CREDENTIALS_PATH,
                scopes: SCOPES,
            });
        } else {
            // Use OAuth authentication (for user accounts) - modern approach
            this.auth = new google.auth.OAuth2(
                credentials.client_id,
                credentials.client_secret,
                credentials.redirect_uris?.[0]
            );
            
            // Set credentials if refresh token is available
            if (credentials.refresh_token) {
                this.auth.setCredentials({
                    refresh_token: credentials.refresh_token,
                    access_token: credentials.access_token
                });
            }
        }

        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
    }

    async createSpreadsheet(title: string): Promise<string> {
        if (!this.sheets) {
            await this.authenticate();
        }

        const resource = {
            properties: {
                title,
            },
        };

        try {
            const spreadsheet = await this.sheets.spreadsheets.create({
                resource,
            });
            console.log(`Spreadsheet created with ID: ${spreadsheet.data.spreadsheetId}`);
            return spreadsheet.data.spreadsheetId;
        } catch (error) {
            console.error('Error creating spreadsheet:', error);
            throw error;
        }
    }

    async readData(config: any): Promise<any[][]> {
        if (!this.sheets) {
            await this.authenticate();
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: config.spreadsheetId,
                range: config.range,
            });
            
            return response.data.values || [];
        } catch (error) {
            console.error('Error reading data:', error);
            throw error;
        }
    }

    async writeData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
        if (!this.sheets) {
            await this.authenticate();
        }

        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'RAW',
                resource: {
                    values,
                },
            });
            console.log(`Data written to range: ${range}`);
        } catch (error) {
            console.error('Error writing data:', error);
            throw error;
        }
    }

    async appendData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
        if (!this.sheets) {
            await this.authenticate();
        }

        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values,
                },
            });
            console.log(`Data appended to range: ${range}`);
        } catch (error) {
            console.error('Error appending data:', error);
            throw error;
        }
    }

    async clearData(spreadsheetId: string, range: string): Promise<void> {
        if (!this.sheets) {
            await this.authenticate();
        }

        try {
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range,
            });
            console.log(`Data cleared from range: ${range}`);
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    async formatCells(spreadsheetId: string, sheetId: number, startRowIndex: number, endRowIndex: number, startColumnIndex: number, endColumnIndex: number, format: any): Promise<void> {
        if (!this.sheets) {
            await this.authenticate();
        }

        const requests = [
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex,
                        endRowIndex,
                        startColumnIndex,
                        endColumnIndex,
                    },
                    cell: {
                        userEnteredFormat: format,
                    },
                    fields: 'userEnteredFormat',
                },
            },
        ];

        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests,
                },
            });
            console.log('Cell formatting applied successfully');
        } catch (error) {
            console.error('Error formatting cells:', error);
            throw error;
        }
    }

    async getSpreadsheetInfo(spreadsheetId: string): Promise<any> {
        if (!this.sheets) {
            await this.authenticate();
        }

        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
            });
            return response.data;
        } catch (error) {
            console.error('Error getting spreadsheet info:', error);
            throw error;
        }
    }

    async uploadFile(filePath: string, folderId?: string): Promise<string> {
        if (!this.drive) {
            await this.authenticate();
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileMetadata: any = {
            name: path.basename(filePath),
        };

        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(filePath),
        };

        try {
            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink',
            });

            console.log(`✅ File uploaded: ${response.data.name} (ID: ${response.data.id})`);
            console.log(`🔗 View at: ${response.data.webViewLink}`);
            
            return response.data.id;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async createFolder(name: string, parentFolderId?: string): Promise<string> {
        if (!this.drive) {
            await this.authenticate();
        }

        const fileMetadata: any = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentFolderId) {
            fileMetadata.parents = [parentFolderId];
        }

        try {
            const response = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id,name,webViewLink',
            });

            console.log(`📁 Folder created: ${response.data.name} (ID: ${response.data.id})`);
            return response.data.id;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    async listFiles(folderId?: string): Promise<any[]> {
        if (!this.drive) {
            await this.authenticate();
        }

        try {
            const query = folderId ? `'${folderId}' in parents` : undefined;
            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id,name,mimeType,createdTime,webViewLink)',
                orderBy: 'createdTime desc',
            });

            return response.data.files || [];
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    async uploadCSVToSheets(csvFilePath: string, spreadsheetName?: string): Promise<string> {
        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found: ${csvFilePath}`);
        }

        // Read and parse CSV
        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        const csvData = lines.map(line => 
            line.split(',').map(cell => cell.replace(/"/g, '').trim())
        );

        // Create new spreadsheet
        const fileName = spreadsheetName || `Import_${path.basename(csvFilePath, '.csv')}_${new Date().toISOString().slice(0, 10)}`;
        const spreadsheetId = await this.createSpreadsheet(fileName);

        // Write data to spreadsheet
        if (csvData.length > 0) {
            const range = `A1:${String.fromCharCode(65 + csvData[0].length - 1)}${csvData.length}`;
            await this.writeData(spreadsheetId, range, csvData);
        }

        console.log(`📊 CSV converted to Google Sheets: ${fileName}`);
        return spreadsheetId;
    }
}