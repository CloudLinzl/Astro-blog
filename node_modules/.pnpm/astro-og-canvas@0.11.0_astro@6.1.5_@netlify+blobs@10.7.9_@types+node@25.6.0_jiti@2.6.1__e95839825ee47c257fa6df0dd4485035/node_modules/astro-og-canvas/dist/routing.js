import { generateOpenGraphImage } from './generateOpenGraphImage';
const pathToSlug = (path, _page, imageOptions) => {
    const format = imageOptions.format || 'PNG';
    const extension = '.' + format.toLowerCase();
    path = path.replace(/^\/src\/pages\//, '');
    path = path.replace(/\.[^\.]*$/, '') + extension;
    path = path.replace(/\/index\.(png|jpeg|webp)$/, extension);
    return path;
};
async function makeGetStaticPaths({ pages, param, getSlug = pathToSlug, getImageOptions, }) {
    const entries = await Promise.all(Object.entries(pages).map(async (page) => {
        const imageOptions = await getImageOptions(...page);
        const slug = getSlug(...page, imageOptions);
        return { slug, imageOptions };
    }));
    const paths = entries.map(({ slug, imageOptions }) => ({
        params: { [param]: slug },
        props: { imageOptions },
    }));
    return function getStaticPaths() {
        return paths;
    };
}
function createOGImageEndpoint() {
    return async function getOGImage({ props }) {
        return new Response(await generateOpenGraphImage(props.imageOptions));
    };
}
export async function OGImageRoute(opts) {
    return {
        getStaticPaths: await makeGetStaticPaths(opts),
        GET: createOGImageEndpoint(),
    };
}
