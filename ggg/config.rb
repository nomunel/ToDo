# Require any additional compass plugins here.

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "css"
sass_dir = "scss"
images_dir = "img"
javascripts_dir = "js"
line_comments = false
cache = false

# Rename Sprite image
module Compass::SassExtensions::Functions::Sprites
  def sprite_url(map)
    verify_map(map, "sprite-url")
    map.generate
    generated_image_url(Sass::Script::String.new(map.name_and_hash))
  end
end
module Compass::SassExtensions::Sprites::SpriteMethods
  def name_and_hash
    "#{path}.png"
  end
  def cleanup_old_sprites
    Dir[File.join(::Compass.configuration.generated_images_path, "#{path}.png")].each do |file|
      log :remove, file
      FileUtils.rm file
      ::Compass.configuration.run_sprite_removed(file)
    end
  end
end
module Compass
  class << SpriteImporter
    def find_all_sprite_map_files(path)
      glob = "sprite-*{#{self::VALID_EXTENSIONS.join(",")}}"
      Dir.glob(File.join(path, "**", glob))
    end
  end
end