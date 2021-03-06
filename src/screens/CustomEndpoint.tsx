
import { ApiPromise, WsProvider } from '@polkadot/api/index';
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';

import { DEFAULT_LOCAL } from '../constants';
import { MetaInfo } from '../types';

interface Props {
  onChangeMetaInfo: (metaInfo: MetaInfo) => void;
  onLoading: () => void;
}

export function CustomEndpoint(props: Props) {
  const { onChangeMetaInfo, onLoading } = props;
  const [endpoint, setEndpoint] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  const handleEndpointChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
    setEndpoint(value);
  }

  const handleGetEndpointMeta = async () => {
    onLoading();

    const provider = new WsProvider(endpoint);
    const api = await ApiPromise.create({ provider });
    const [chain, props] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.properties()
    ]);

    const metaInfo = {
      chain: chain.toString(),
      endpoint,
      genesisHash: api.genesisHash.toHex(),
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      ss58Format: props.ss58Format.unwrapOr(42),
      tokenDecimals: props.tokenDecimals.unwrapOr(0),
      metaCalls: Buffer.from(api.runtimeMetadata.asCallsOnly.toU8a()).toString('base64')
    }

    onChangeMetaInfo(metaInfo);
  
    // output the chain info, for easy re-use
    console.error(`
    // Generated via 'yarn run chain:info ${endpoint}'
      \n
      \n export default {
      \n  chain: '${chain.toString()}',
      \n  genesisHash: '${api.genesisHash.toHex()}',
      \n  specVersion: ${api.runtimeVersion.specVersion.toNumber()},
      \n  ss58Format: ${props.ss58Format.unwrapOr(42)},
      \n  tokenDecimals: ${props.tokenDecimals.unwrapOr(0)},
      \n  tokenSymbol: '${props.tokenSymbol.unwrapOr('UNIT')}',
      \n  metaCalls: '${Buffer.from(api.runtimeMetadata.asCallsOnly.toU8a()).toString('base64')}'
      \n};`);
  
    // show any missing types
    api.runtimeMetadata.getUniqTypes(false);
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <input
          onChange={handleEndpointChange}
          value={endpoint}
          placeholder="Enter Custom RPC Endpoint here, for example: wss://kusama-rpc.polkadot.io"
          style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => setEndpoint(DEFAULT_LOCAL)} variant="secondary">localhost:9944</Button>
        <Button onClick={handleGetEndpointMeta} variant="primary">
          Submit
        </Button>
        {error}
      </div>
    </div>
  );
}