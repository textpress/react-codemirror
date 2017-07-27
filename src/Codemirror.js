const React = require('react');
const ReactDOM = require('react-dom');
const PropTypes = require('prop-types');
const className = require('classnames');
const isEqual = require('lodash.isequal');
const createReactClass = require('create-react-class');

function normalizeLineEndings (str) {
	if (!str) return str;
	return str.replace(/\r\n|\r/g, '\n');
}

const CodeMirror = createReactClass({
	propTypes: {
		autoFocus: PropTypes.bool,
		className: PropTypes.any,
		codeMirrorInstance: PropTypes.func,
		defaultValue: PropTypes.string,
		name: PropTypes.string,
		onChange: PropTypes.func,
		onCursorActivity: PropTypes.func,
		onFocusChange: PropTypes.func,
		onScroll: PropTypes.func,
		options: PropTypes.object,
		path: PropTypes.string,
		value: PropTypes.string,
		preserveScrollPosition: PropTypes.bool,
	},
	getDefaultProps () {
		return {
			preserveScrollPosition: false,
		};
	},
	getCodeMirrorInstance () {
		return this.props.codeMirrorInstance || require('codemirror');
	},
	getInitialState () {
		return {
			isFocused: false,
		};
	},
	componentWillMount () {
		if (this.props.path) {
			console.error('Warning: react-codemirror: the `path` prop has been changed to `name`');
		}
	},
	componentDidMount () {
		const codeMirrorInstance = this.getCodeMirrorInstance();
		this.codeMirror = codeMirrorInstance(cm => this.ref.appendChild(cm), this.props.options);
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('cursorActivity', this.cursorActivity);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('scroll', this.scrollChanged);
		this.codeMirror.setValue(this.props.defaultValue || this.props.value || '');
		this.resizeElement.data = 'about:blank';
	},
	componentWillUnmount () {
		if (this.codeMirror) {
			this.ref.removeChild(this.codeMirror.getWrapperElement());
		}

		if (this.resizeTarget) {
			this.resizeTarget.removeEventListener('resize', this.handleResize);
		}
	},
	componentWillReceiveProps: function (nextProps) {
		if (this.codeMirror && nextProps.value !== undefined && nextProps.value !== this.props.value && normalizeLineEndings(this.codeMirror.getValue()) !== normalizeLineEndings(nextProps.value)) {
			if (this.props.preserveScrollPosition) {
				var prevScrollPosition = this.codeMirror.getScrollInfo();
				this.codeMirror.setValue(nextProps.value);
				this.codeMirror.scrollTo(prevScrollPosition.left, prevScrollPosition.top);
			} else {
				this.codeMirror.setValue(nextProps.value);
			}
		}
		if (typeof nextProps.options === 'object') {
			for (let optionName in nextProps.options) {
				if (nextProps.options.hasOwnProperty(optionName)) {
					this.setOptionIfChanged(optionName, nextProps.options[optionName]);
				}
			}
		}
	},
	setOptionIfChanged (optionName, newValue) {
 		const oldValue = this.codeMirror.getOption(optionName);
 		if (!isEqual(oldValue, newValue)) {
 			this.codeMirror.setOption(optionName, newValue);
 		}
 	},
	getCodeMirror () {
		return this.codeMirror;
	},
	focus () {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},
	focusChanged (focused) {
		this.setState({
			isFocused: focused,
		});
		this.props.onFocusChange && this.props.onFocusChange(focused);
	},
	cursorActivity (cm) {
		this.props.onCursorActivity && this.props.onCursorActivity(cm);
	},
	scrollChanged (cm) {
		this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
	},
	codemirrorValueChanged (doc, change) {
		if (this.props.onChange && change.origin !== 'setValue') {
			this.props.onChange(doc.getValue(), change);
		}
	},
	resizeElementLoaded ( event ) {
		this.resizeTarget = event.target.contentDocument.defaultView;
        this.resizeTarget.addEventListener('resize', this.handleResize);
	},
	handleResize () {
		if (this.codeMirror) {
			this.codeMirror.refresh();
		}
	},
	render () {
		const editorClassName = className(
			'ReactCodeMirror',
			this.state.isFocused ? 'ReactCodeMirror--focused' : null,
			this.props.className
		);
		return (
			<div
				className={editorClassName}
				style={ { position: 'relative' } }
				ref={ref => this.ref = ref}
				>
				<object
					type='text/html'
					style={ { display: 'block', position: 'absolute',
					  	top: 0, left: 0, height: '100%', width: '100%',
					  	overflow: 'hidden', pointerEvents: 'none', zIndex: -1,
				  		} }
					ref={ref => this.resizeElement = ref}
					onLoad={ this.resizeElementLoaded }
					/>
			</div>
		);
	},
});

module.exports = CodeMirror;
