import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/*!
 * TinyText v${pkg.version}
 * (c) ${new Date().getFullYear()} Antigravity
 * MIT License
 */`;

export default [
    // ESM build
    {
        input: 'src/index.ts',
        output: {
            file: pkg.module,
            format: 'esm',
            banner,
            sourcemap: true,
        },
        plugins: [
            resolve({ browser: true }),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json', declaration: false }),
            postcss({
                extract: 'tinytext.css',
                minimize: true,
                sourceMap: true,
            }),
        ],
    },
    // CJS build
    {
        input: 'src/index.ts',
        output: {
            file: pkg.main,
            format: 'cjs',
            banner,
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            resolve({ browser: true }),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist/types' }),
            postcss({
                inject: false,
                extract: false,
            }),
        ],
    },
];
