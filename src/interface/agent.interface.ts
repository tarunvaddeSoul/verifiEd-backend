export interface IndyVdrPoolConfig {
    genesisTransactions: string;
    isProduction: boolean;
    indyNamespace: string;
    transactionAuthorAgreement?: TransactionAuthorAgreement;
    connectOnStartup?: boolean;
}

export interface TransactionAuthorAgreement {
    version?: `${number}.${number}` | `${number}`;
    acceptanceMechanism: string;
}