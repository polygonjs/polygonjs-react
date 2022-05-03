import React, {Component} from 'react';
import './PolygonjsScene.css';

import {PolyScene} from '@polygonjs/polygonjs/dist/src/engine/scene/PolyScene';
import {BaseViewerType} from '@polygonjs/polygonjs/dist/src/engine/viewers/_Base';
import {ThreejsViewer} from '@polygonjs/polygonjs/dist/src/engine/viewers/Threejs';

interface LoadSceneOptions {
	onProgress: (progress: number) => void;
	domElement: HTMLElement;
	printWarnings: boolean;
}
interface LoadedData {
	scene: PolyScene;
	viewer: BaseViewerType | undefined;
}
type LoadScene = (options: LoadSceneOptions) => Promise<LoadedData>;

interface PolygonjsSceneProps<S extends PolyScene> {
	loadFunction: LoadScene;
	sceneName: string;
	displayLoadingProgressBar: boolean;
	displayLoadingPoster: boolean;
	posterUrl?: string;
	printWarnings: boolean;
	onProgress?: (progress: number) => void;
	onSceneReady?: (scene: S) => void;
	onViewerReady?: (scene: BaseViewerType) => void;
	render: boolean;
	loadScene: boolean;
}

interface PolygonjsSceneState {
	progress: number;
}

export class PolygonjsScene<S extends PolyScene> extends Component<PolygonjsSceneProps<S>, PolygonjsSceneState> {
	public static defaultProps = {
		printWarnings: false,
		displayLoadingProgressBar: true,
		displayLoadingPoster: true,
		render: true,
		loadScene: true,
	};
	public containerRef: React.RefObject<HTMLDivElement> = React.createRef();
	private _mounted = false;
	private _scene: S | undefined;
	private _viewer: BaseViewerType | undefined;
	private _polygonjsContainer = (<div className="polygonjs-scene" ref={this.containerRef}></div>);
	constructor(props: PolygonjsSceneProps<S>) {
		super(props);

		this.state = {
			progress: 0,
		};
	}

	componentDidMount() {
		if (this._mounted) {
			return;
		}
		this._mounted = true;
		const element = this.containerRef.current;
		if (element) {
			this.loadScene(element);
		}
	}
	componentWillUnmount() {
		this.disposeScene();
	}
	componentDidUpdate(prevProps: PolygonjsSceneProps<S>) {
		if (prevProps.render !== this.props.render) {
			this._updateViewerAutoRender();
		}
	}

	disposeScene() {
		if (this._scene) {
			this._scene.dispose();
		}
		if (this._viewer) {
			this._viewer.dispose();
		}
	}

	async loadScene(container: HTMLDivElement) {
		if (!this.props.loadScene) {
			return;
		}
		const {loadFunction} = this.props;
		const loadedData = await loadFunction({
			onProgress: (progress) => this.onProgress(progress),
			domElement: container as any,
			printWarnings: this.props.printWarnings,
		});
		this._scene = loadedData.scene as S;
		this._viewer = loadedData.viewer;
		if (this.props.onSceneReady) {
			this.props.onSceneReady(this._scene);
		}
		if (this.props.onViewerReady && this._viewer) {
			this.props.onViewerReady(this._viewer);
			this._updateViewerAutoRender();
		}
	}
	private _updateViewerAutoRender() {
		if (!this._viewer) {
			return;
		}
		const threejsViewer = this._viewer as ThreejsViewer;
		if (!threejsViewer.setAutoRender) {
			return;
		}
		threejsViewer.setAutoRender(this.props.render);
	}

	onProgress(progress: number) {
		if (this.props.onProgress) {
			this.props.onProgress(progress);
		}
		this.setState({progress: progress});
	}

	// loadingCompleted() {
	// 	return this.state.progress < 1;
	// }
	/*
	 *
	 * PROGRESS BAR
	 *
	 */
	progressBarClassObject() {
		const visible = this.state.progress > 0 && this.state.progress < 1;
		const classNames: string[] = ['fadeable'];
		if (visible) {
			classNames.push('visible');
		}
		if (!visible) {
			classNames.push('hidden');
		}
		return classNames;
	}
	progressBarBarStyleObject() {
		const percent = Math.round(this.state.progress * 100);
		return {
			width: `${percent}%`,
		};
	}
	/*
	 *
	 * POSTER
	 *
	 */
	private _createBackgroundImage() {
		const posterUrl = this.props.posterUrl || `/polygonjs/screenshots/scenes/${this.props.sceneName}/poster.png`;
		const style = {
			backgroundImage: `url('${posterUrl}')`,
		};
		const poster = (
			<div
				className={['polygonjs-scene-container-poster'].concat(this.posterClassObject()).join(' ')}
				style={style}
			></div>
		);
		return this.props.displayLoadingPoster ? poster : null;
	}
	posterClassObject() {
		const visible = this.state.progress < 1;
		const classNames: string[] = ['fadeable'];
		if (visible) {
			classNames.push('visible');
		}
		if (!visible) {
			classNames.push('hidden');
		}
		return classNames;
	}

	/*
	 *
	 * RENDER
	 *
	 */
	render() {
		const progressBar = (
			<div className={['progress-bar'].concat(this.progressBarClassObject()).join(' ')}>
				<div className="progress-bar-bar" style={this.progressBarBarStyleObject()}></div>
			</div>
		);
		const progressBarIfRequired = this.props.displayLoadingProgressBar ? progressBar : null;

		return (
			<div className="polygonjs-scene-container">
				{this._createBackgroundImage()}
				{progressBarIfRequired}
				{this._polygonjsContainer}
			</div>
		);
	}
}
