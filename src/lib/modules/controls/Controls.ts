import type {
	AnyControl,
	ControlNodesMap,
	ControlsConfig,
	ControlsData
} from '$lib/types/controls';

export class Controls {
	params: ControlsData;
	nodes: ControlNodesMap;
	groups: string[];

	constructor({ config }: { config: ControlsConfig }) {
		this.params = config.defaults || {};
		this.nodes = config.nodes;
		this.groups = config.groups;
	}

	addControlNode = (control: AnyControl) => {
		this.nodes = {
			...this.nodes,
			[control.key]: control
		};
	};

	addGroup = (groupName: string) => {
		this.groups.push(groupName);
	};

	get config(): ControlsConfig {
		return {
			groups: this.groups,
			nodes: this.nodes
		};
	}
}
