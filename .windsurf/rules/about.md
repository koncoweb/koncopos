---
trigger: manual
---

# Project Structure and Features

## Overview

This Expo React Native project is a mobile Point of Sale (POS) application with integrated inventory management. It supports multiple stores, role-based permissions, and real-time data synchronization using Firebase.

## File and Folder Structure

-   `.expo`: Contains Expo-related configuration and build artifacts.
-   `.git`: Git repository for version control.
-   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
-   `app`: Contains the application's routing structure and UI components.
    -   `(auth)`: Authentication-related screens (login, register).
    -   `[...unmatched].tsx`: Catch-all route for handling unmatched URLs.
    -   `_layout.tsx`: Defines the layout for the entire application.
    -   `index.tsx`: The main entry point of the application.
    -   `inventory.tsx`: Inventory management screen.
    -   `pos.tsx`: Point of Sale interface screen.
    -   `tempobook`: Tempo-related files for design and development.
        -   `dynamic`: Dynamically generated files for Tempo.
        -   `components`: Storyboard files for individual components.
-   `assets`: Contains static assets such as fonts and images.
    -   `fonts`: Custom fonts used in the application.
    -   `images`: Images used in the application.
-   `components`: Reusable UI components.
    -   `AdminSettings.tsx`: Component for admin settings.
    -   `CategoryManager.tsx`: Component for managing product categories.
    -   `CreateTransfer.tsx`: Component for creating inventory transfers.
    -   `DashboardMenu.tsx`: Component for the main dashboard menu.
    -   `DataMigrationService.tsx`: Component for data migration tasks.
    -   `Header.tsx`: Component for the application header.
    -   `InventoryManagement.tsx`: Component for managing inventory.
    -   `LoginScreen.tsx`: Component for the login screen.
    -   `MobileShoppingCart.tsx`: Component for the mobile shopping cart.
    -   `POSInterface.tsx`: Component for the Point of Sale interface.
    -   `PaymentProcessor.tsx`: Component for processing payments.
    -   `ProductDetail.tsx`: Component for displaying product details.
    -   `ProductGrid.tsx`: Component for displaying products in a grid.
    -   `ProductList.tsx`: Component for displaying a list of products.
    -   `ReceiveTransfer.tsx`: Component for receiving inventory transfers.
    -   `ShoppingCart.tsx`: Component for the shopping cart.
    -   `TransactionDetail.tsx`: Component for displaying transaction details.
    -   `TransactionHistory.tsx`: Component for displaying transaction history.
    -   `TransactionList.tsx`: Component for displaying a list of transactions.
    -   `TransferManagement.tsx`: Component for managing inventory transfers.
    -   `UserManagement.tsx`: Component for managing users and roles.
    -   `WarehouseStockDebugger.tsx`: Component for debugging warehouse stock levels.
-   `contexts`: React contexts for managing global state.
    -   `AuthContext.tsx`: Manages user authentication state.
    -   `FirebaseConfigContext.tsx`: Manages Firebase configuration.
-   `data`: Contains initial data for the application.
    -   `initialProducts.ts`: Initial product data.
    -   `initialTransactions.ts`: Initial transaction data.
-   `hooks`: Custom React hooks.
    -   `useInventoryData.ts`: Hook for fetching inventory data.
-   `services`: Contains services for interacting with Firebase and local storage.
    -   `firebaseService.ts`: Service for interacting with Firebase.
    -   `index.ts`: Export file for services.
    -   `storage.ts`: Service for interacting with local storage.
-   `app.json`: Expo application configuration file.
-   `babel.config.js`: Babel configuration file.
-   `global.css`: Global CSS styles for the application.
-   `metro.config.js`: Metro bundler configuration file.
-   `package-lock.json`: Records the exact versions of dependencies used in the project.
-   `package.json`: Lists project dependencies and scripts.
-   `postcss.config.js`: PostCSS configuration file.
-   `tailwind.config.js`: Tailwind CSS configuration file.
-   `tsconfig.json`: TypeScript configuration file.

## Data Types

-   **UserProfile**:
    -   `id`: string - User ID.
    -   `email`: string - User email address.
    -   `displayName`: string - User's display name.
    -   `role`: 'owner' | 'warehouse_admin' | 'cashier' - User role.
    -   `storeId`: string - ID of the store the user is assigned to.
    -   `storeName`: string - Name of the store the user is assigned to.
    -   `warehouseId`: string - ID of the warehouse the user is assigned to.
    -   `warehouseName`: string - Name of the warehouse the user is assigned to.
    -   `permissions`: string[] - List of user permissions.
    -   `createdAt`: string - Timestamp of when the user was created.
-   **Store**:
    -   `id`: string - Store ID.
    -   `name`: string - Store name.
    -   `location`: string - Store location.
-   **Warehouse**:
    -   `id`: string - Warehouse ID.
    -   `name`: string - Warehouse name.
    -   `storeId`: string - ID of the store the warehouse is assigned to.

## Key Features

-   **Authentication**: User authentication using Firebase.
-   **Role-Based Permissions**: Control data access based on user roles (owner, warehouse admin, cashier).
-   **Inventory Management**: Manage inventory levels, track stock, and manage warehouses.
-   **Point of Sale (POS)**: Process sales transactions and generate receipts.
-   **Transaction History**: View and manage transaction history.
-   **Inventory Transfers**: Create and manage inventory transfers between warehouses.
-   **Multi-Store Support**: Support multiple stores with separate inventory and transactions.
