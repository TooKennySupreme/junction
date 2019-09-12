import React from 'react';
import { connect } from 'react-redux';
import AddSigners from './AddSigners';
import Signers from './Signers';
import { Device } from '../types'
import { AppState } from '../store';
import { getWallets, selectCandidateDevicesForActiveWallet, selectActiveWallet } from '../store/wallet';
import { Spinner } from 'reactstrap';
import api from '../api'

interface StateProps {
  candidateDevices: Device[];
  activeWallet: AppState['wallet']['activeWallet'];
}

interface DispatchProps {
  getWallets: typeof getWallets;
}

interface State {
  deviceBeingAdded: Device | null;
}

type Props = StateProps & DispatchProps;

class Wallet extends React.Component<Props, State> {
  state: State = {
    deviceBeingAdded: null,
  }
  private addSigner = async (device: Device) => {
    if (this.props.activeWallet) {
      this.setState({ deviceBeingAdded: device })
      await api.addSigner({
        wallet_name: this.props.activeWallet.name,
        signer_name: device.type,
        device_id: device.fingerprint,
      })
      // FIXME: state.wallet.activeWallet goes stale here
      await this.props.getWallets();
    }
  }
  render() {
    const { deviceBeingAdded } = this.state;
    const { candidateDevices, activeWallet, deviceError } = this.props;
    if (activeWallet === null) {
      return <div>no active wallet</div>
    }
    const { signers } = activeWallet;
    return (
      <div>
        <h3>{ activeWallet.name } ({activeWallet.m}/{activeWallet.n})</h3>
        {activeWallet.ready && 
          <div>Confirmed Balance: {activeWallet.balances.confirmed}</div>
        }
        {activeWallet.balances.unconfirmed > 0 &&
          <div>Unconfirmed Balance: {activeWallet.balances.unconfirmed}</div>}
        <h3>Signers</h3>
        <Signers signers={signers} />
        <h3>Add {activeWallet.n - activeWallet.signers.length} More Signers</h3>
        <AddSigners devices={candidateDevices} deviceError={deviceError}  deviceBeingAdded={deviceBeingAdded} addSigner={this.addSigner}/>
      </div>
    )
  }
}
  
export const mapStateToProps = (state: AppState) => {
  return {
    candidateDevices: selectCandidateDevicesForActiveWallet(state),
    activeWallet: selectActiveWallet(state),
    deviceError: state.device.devices.error,
  }
}

export default connect(
  mapStateToProps,
  { getWallets },
)(Wallet);