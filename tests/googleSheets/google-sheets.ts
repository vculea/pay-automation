import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleSheetsService {
    private sheets: any;
    private auth: GoogleAuth | any;

    constructor() {
        this.auth = null;
        this.sheets = null;
    }

    async authenticate() {
        const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
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
}