const SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;

export class Utility {
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), SIZE_UNITS.length - 1);
        const value = bytes / Math.pow(k, unitIndex);
        return `${parseFloat(value.toFixed(decimals))} ${SIZE_UNITS[unitIndex]}`;
    }
}
