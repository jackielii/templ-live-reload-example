package main

import (
	"cmp"
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/angelofallars/htmx-go"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackielii/templ-live-reload-example/comp"
	"github.com/joho/godotenv"
)

func devNoCache(next http.Handler) http.Handler {
	dev := os.Getenv("DEV") == "true"
	if !dev {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

func newRoot() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5))

	r.With(devNoCache).Mount("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("assets"))))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		comp.IndexPage().Render(r.Context(), w)
	})

	r.Get("/click", func(w http.ResponseWriter, r *http.Request) {
		if htmx.IsHTMX(r) {
			comp.Clicked().Render(r.Context(), w)
		} else {
			comp.ClickedPage().Render(r.Context(), w)
		}
	})

	return r
}

func run(port string, h http.Handler) {
	addr := fmt.Sprintf(":%s", port)

	// The HTTP Server
	slog.Info("Listening", "addr", addr)
	server := &http.Server{Addr: addr, Handler: h}

	// Server run context
	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	// Listen for syscall signals for process to interrupt/quit
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		// Shutdown signal with grace period of 30 seconds
		duration := 30 * time.Second
		shutdownCtx, cancel := context.WithTimeout(serverCtx, duration)
		defer cancel()
		slog.Info("Gracefully shutting down server...", "timeout", duration)

		go func() {
			for {
				select {
				case <-shutdownCtx.Done():
					if shutdownCtx.Err() == context.DeadlineExceeded {
						log.Fatal("graceful shutdown timed out.. forcing exit.")
					}
				case <-time.After(1 * time.Second):
					slog.Info("waiting for server to shutdown..")
				}
			}
		}()

		// Trigger graceful shutdown
		err := server.Shutdown(shutdownCtx)
		if err != nil {
			log.Fatal(err)
		}
		serverStopCtx()
	}()

	// Run the server
	err := server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}

	// Wait for server context to be stopped
	<-serverCtx.Done()
}

func main() {
	godotenv.Load(".env")
	root := newRoot()
	port := cmp.Or(os.Getenv("PORT"), "8080")
	run(port, root)
}
