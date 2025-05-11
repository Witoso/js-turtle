import eslintPlugin from '@eslint/js';
import jsdoc from "eslint-plugin-jsdoc";

export default [

	{
		...eslintPlugin.configs.recommended,
	},
	jsdoc.configs['flat/recommended'],

];