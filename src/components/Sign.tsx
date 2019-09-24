import React from 'react';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router';
import { Form, FormGroup, Input, Label, Button, Row, Col } from 'reactstrap';
import { getWallets, selectActiveWallet } from '../store/wallet';
import { toggleDeviceInstructionsModal } from '../store/modal';
import { AppState } from '../store';
import api, { CreatePSBTOutput } from '../api';
import { MyCard, MyTable } from './Toolbox'
import { Wallet, Signer, Device } from '../types';
import './Send.css'

interface DispatchProps {
  getWallets: typeof getWallets;
  toggleDeviceInstructionsModal: typeof toggleDeviceInstructionsModal;
}

type Props = DispatchProps & StateProps & RouteComponentProps;

interface StateProps {
  activeWallet: Wallet | null;
  devices: AppState['device']['devices']['data'];
}

interface LocalState {
  isSubmitting: boolean;
  error: Error | null;
}

function signedBySigner(signer: Signer, psbt: any) {
  for (let input of psbt.inputs) {
    let signed = false;
    for (let deriv of input.bip32_derivs) {
      const fingerprintMatch = deriv.master_fingerprint == signer.fingerprint;
      if (!input.partial_signatures) {
        return false;
      }
      const pubkeyMatch = input.partial_signatures.contains(deriv.pubkey);
      if (fingerprintMatch && pubkeyMatch) {
        signed = true
      }
    }
    // return false if any input is unsigned
    if (!signed) return false;
  }
  // if every input is signed, return true
  return true;
}

function deviceAvailable(signer: Signer, devices: Device[]) {
  // look for a device with fingerprint matching signer's fingerprint
  for (let device of devices) {
    // FIXME: this check sucks
    if ('fingerprint' in device && device.fingerprint === signer.fingerprint) {
      return device
    }
  }
  return null;
}

class Sign extends React.Component<Props, LocalState> {
  state: LocalState = {
    isSubmitting: false,
    error: null,
  };

  renderSigner(signer: Signer, psbt: any, devices: Device[]) {
    const device = deviceAvailable(signer, devices)
    const { toggleDeviceInstructionsModal } = this.props
    if (signedBySigner(signer, psbt)) {
      return (
        <tr key={signer.fingerprint}>
          <td>{ signer.name }</td>
          <td className="text-right">Signed</td>
        </tr>
      )
    } else if (device) {
      return (
        <tr key={signer.name}>
          <td>{ signer.name }</td>
          <td className="text-right">
            <Button>Sign</Button>
          </td>
        </tr>
      )
    } else {
      console.log(signer)
      return (
        <tr key={signer.name}>
          <td>{ signer.name }</td>
          <td className="text-right">
            <Button onClick={() => toggleDeviceInstructionsModal(signer.type)}>Unlock</Button>
          </td>
        </tr>
      )
      }
  }

  render() {
    const { activeWallet, devices } = this.props;
    if (!activeWallet || !devices) {
      return <div>loading</div>
    }
    if (!activeWallet.psbt) {
      return <div>no psbt</div>
    }
    const { psbt, signers } = activeWallet;
    return (
      <div>
      <MyTable>
        <tbody>
          <h4>Outputs</h4>
          {psbt.tx.vout.map((vout: any, index: number) => (
            <tr key={index}>
              <td>#{ index }</td>
              <td>{ vout.scriptPubKey.addresses[0] }</td>
              <td className="text-right">{ vout.value } BTC</td>
            </tr>
          ))}
          <h4>Signatures</h4>
          {signers.map((signer: Signer) => this.renderSigner(signer, psbt, devices))}
        </tbody>
      </MyTable>
      </div>
    )
  }
}

const ConnectedSign = connect<StateProps, DispatchProps, RouteComponentProps, AppState>(
  state => ({
    activeWallet: selectActiveWallet(state),
    devices: state.device.devices.data,
  }),
  { getWallets, toggleDeviceInstructionsModal },
)(Sign);

export default withRouter(ConnectedSign)