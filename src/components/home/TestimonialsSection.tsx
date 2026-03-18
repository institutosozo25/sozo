import { Star } from "lucide-react";
import { useTestimonials } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

export function TestimonialsSection() {
  const { data: testimonials, isLoading } = useTestimonials();

  const activeTestimonials = testimonials?.filter((t) => t.is_active) ?? [];

  if (!isLoading && activeTestimonials.length === 0) return null;

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Depoimentos
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Milhares de profissionais e empresas confiam no Instituto Plenitude Sozo 
            para desenvolvimento pessoal e organizacional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-8 rounded-2xl bg-card border border-border">
                  <Skeleton className="h-5 w-28 mb-4" />
                  <Skeleton className="h-20 w-full mb-6" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))
            : activeTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="p-8 rounded-2xl bg-card border border-border hover:border-secondary/30 transition-all duration-300 hover:shadow-sozo-lg animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    {testimonial.image_url && (
                      <img
                        src={testimonial.image_url}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-heading font-bold text-foreground">{testimonial.name}</p>
                      <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
