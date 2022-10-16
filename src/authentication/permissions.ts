// This file contains all data on permissions, along with some util methods

// All permissions
export enum ServerPermission {
    // Default Permissions
    VIEW_CONSOLE = 1 << 0,
    USE_CONSOLE = 1 << 1,
    CONTROL_SERVER = 1 << 2,
    READ_FILES = 1 << 3,
    WRITE_FILES = 1 << 4,
    MANAGE_PLAYERS = 1 << 5,
    VIEW_PERFORMANCE = 1 << 6,
    VIEW_PLUGINS = 1 << 7,
    MANAGE_PLUGINS = 1 << 8,
    FTP_ACCESS = 1 << 9,

    // Management Permissions
    MANAGE_SUBUSERS = 1 << 10,
    MANAGE_INTEGRATIONS = 1 << 11,
    MANAGE_SERVER = 1 << 12
}

export function hasPermission(user: Permissionable, permission: ServerPermission) {
    
}