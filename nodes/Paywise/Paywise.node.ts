import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';
import { PaywiseV1 } from './v1/PaywiseV1.node';
import { PaywiseV2 } from './v2/PaywiseV2.node';

export class Paywise extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'paywise',
			name: 'paywise',
			icon: { light: 'file:../../icons/paywise.svg', dark: 'file:../../icons/paywise.dark.svg' },
			group: ['transform'],
			description: 'Submit and track debt collection cases with paywise',
			defaultVersion: 2,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new PaywiseV1(baseDescription),
			2: new PaywiseV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
