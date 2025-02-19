const { src, dest } = require('gulp');

function copyIcons() {
	// Copy to both locations to ensure compatibility
	return src('nodes/**/*.svg')
		.pipe(dest('dist/nodes'))  // Original location
		.pipe(dest('dist'));       // Root location
}

exports['copy:icons'] = copyIcons; 