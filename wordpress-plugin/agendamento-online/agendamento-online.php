<?php
/**
 * Plugin Name: Agendamento online
 * Description: Botão que abre o chat de agendamento da sua página em uma janela por cima do site.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * License: GPLv2 or later
 * Text Domain: agendamento-online
 */

if (!defined('ABSPATH')) {
    exit;
}

const AGENDAMENTO_ONLINE_OPTION = 'agendamento_online_settings';

/** Settings: base address of the brand (e.g. https://suamarca.com.br) and the page slug. */
function agendamento_online_settings(): array
{
    $defaults = ['base' => '', 'slug' => ''];
    return wp_parse_args((array) get_option(AGENDAMENTO_ONLINE_OPTION, []), $defaults);
}

add_action('admin_menu', function () {
    add_options_page('Agendamento online', 'Agendamento online', 'manage_options', 'agendamento-online', 'agendamento_online_settings_page');
});

add_action('admin_init', function () {
    register_setting('agendamento_online', AGENDAMENTO_ONLINE_OPTION, [
        'sanitize_callback' => function ($input) {
            $base = esc_url_raw(trim($input['base'] ?? ''));
            $slug = strtolower(trim($input['slug'] ?? ''));
            return [
                'base' => untrailingslashit($base),
                'slug' => preg_match('/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/', $slug) ? $slug : '',
            ];
        },
    ]);
});

function agendamento_online_settings_page(): void
{
    $settings = agendamento_online_settings();
    ?>
    <div class="wrap">
        <h1>Agendamento online</h1>
        <form method="post" action="options.php">
            <?php settings_fields('agendamento_online'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="ao-base">Endereço da plataforma</label></th>
                    <td><input id="ao-base" type="url" class="regular-text" name="<?php echo esc_attr(AGENDAMENTO_ONLINE_OPTION); ?>[base]" value="<?php echo esc_attr($settings['base']); ?>" placeholder="https://suamarca.com.br" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="ao-slug">Endereço da sua página</label></th>
                    <td><input id="ao-slug" type="text" class="regular-text" name="<?php echo esc_attr(AGENDAMENTO_ONLINE_OPTION); ?>[slug]" value="<?php echo esc_attr($settings['slug']); ?>" placeholder="meu-negocio" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <p>Use o atalho <code>[agendamento texto="Agendar horário"]</code> em qualquer página ou post.</p>
    </div>
    <?php
}

/** [agendamento texto="Agendar horário"] — a normal link enhanced by embed.js. */
add_shortcode('agendamento', function ($atts) {
    $settings = agendamento_online_settings();
    if ($settings['base'] === '' || $settings['slug'] === '') {
        return '';
    }
    $atts = shortcode_atts(['texto' => 'Agendar horário'], $atts, 'agendamento');
    wp_enqueue_script('agendamento-online', $settings['base'] . '/embed.js', [], null, true);
    return sprintf(
        '<a class="agendamento-online-botao wp-element-button" href="%s" data-lively-slug="%s">%s</a>',
        esc_url($settings['base'] . '/' . $settings['slug']),
        esc_attr($settings['slug']),
        esc_html($atts['texto'])
    );
});
