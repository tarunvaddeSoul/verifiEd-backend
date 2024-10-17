import { AutoAcceptCredential, AutoAcceptProof, LogLevel, InitConfig, Agent } from "@credo-ts/core"
import { agentDependencies, HttpInboundTransport, WsInboundTransport } from "@credo-ts/node"
import { HttpOutboundTransport, WsOutboundTransport } from '@credo-ts/core'
import { CredoRestAgentConfig } from "@credo-ts/rest"
import { TsLogger } from "./logger"
import { getAgentModules } from "./agent"
import type { IndyVdrPoolConfig } from '@credo-ts/indy-vdr'

export const inboundTransportMapping = {
    http: HttpInboundTransport,
    ws: WsInboundTransport,
  } as const
  
  export const outboundTransportMapping = {
    http: HttpOutboundTransport,
    ws: WsOutboundTransport,
  } as const


export async function createRestAgent(config: CredoRestAgentConfig): Promise<Agent> {
  const {
    logLevel,
    inboundTransports = [],
    outboundTransports = [],
    indyLedgers = [],
    cheqdLedgers = [],
    autoAcceptConnections = true,
    autoAcceptCredentials = AutoAcceptCredential.ContentApproved,
    autoAcceptMediationRequests = true,
    autoAcceptProofs = AutoAcceptProof.ContentApproved,
    multiTenant = false,
    ...credoConfig
  } = config

  const logger = new TsLogger(logLevel ?? LogLevel.error)

  const agentConfig: InitConfig = {
    ...credoConfig,
    logger,
  }

  const httpEndpoint = credoConfig.endpoints?.find(
    (endpoint) => endpoint.startsWith('http://') || endpoint.startsWith('https://'),
  )
  if (!httpEndpoint) {
    throw new Error('No http endpoint found in config, unable to set up OpenID4VC modules.')
  }
  const maybeIndyLedgers =
  indyLedgers.length > 0 ? (indyLedgers as [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]) : undefined
  const modules = getAgentModules({
    autoAcceptConnections,
    autoAcceptProofs,
    autoAcceptCredentials,
    autoAcceptMediationRequests,
    indyLedgers: maybeIndyLedgers,
    multiTenant,
    baseUrl: httpEndpoint,
  })

  const agent = new Agent({
    config: agentConfig,
    dependencies: agentDependencies,
    modules,
  })

  // Register outbound transports
  for (const outboundTransport of outboundTransports) {
    const OutboundTransport = outboundTransportMapping[outboundTransport]
    agent.registerOutboundTransport(new OutboundTransport())
  }

  // Register inbound transports
  for (const inboundTransport of inboundTransports) {
    const InboundTransport = inboundTransportMapping[inboundTransport.transport]
    const transport = new InboundTransport({ port: inboundTransport.port })
    agent.registerInboundTransport(transport)

    // Configure the oid4vc routers on the http inbound transport
    // if (transport instanceof HttpInboundTransport) {
    //   transport.app.use('/oid4vci', modules.openId4VcIssuer.config.router)
    //   transport.app.use('/siop', modules.openId4VcVerifier.config.router)
    // }
  }

  await agent.initialize()
  return agent
}
