import { buildListView } from './articleListView.js';

const view = buildListView('case-studies');

export const fbPath = view.fbPath;
export const sections = view.sections;
export const defaults = view.defaults;
export const customRender = view.customRender;
